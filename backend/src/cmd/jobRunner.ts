import {jobCol} from "../mongo";
import {makeMissingDirs} from "../ingester/info";
import {formatTime} from "../../../common/utils";
import {readAllFromCursor, sleep} from "../utils";
import {ObjectId} from "mongodb";
import {Job, JobStatus} from "../../../common/jobs";
import {JobRunner, jobRunners, JobWithId} from "../jobs";

const runnerId = process.env.RUNNER_ID
if (!runnerId) {
  throw new Error('Environment variable RUNNER_ID not set. Please set it to a unique value for each job runner.')
}

const backoffStart = 1000 // ms
const activeBackoffMax = 10 * 1000
const idleBackoffMax = 60 * 1000
const nextBackoff = (prev: number, max: number): number => Math.min(max, prev * 1.5)

const getJob = async (id: ObjectId): Promise<JobWithId | undefined> => {
  const res = await jobCol.findOne({ _id: id })
  if (res) return res
  return undefined
}
const saveReady = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Ready } })
}
const saveStartedAt = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { startedAt: new Date() } })
}
const saveRunning = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Running } })
}
const saveCompleted = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Completed, completedAt: new Date() } })
}
const saveErrored = async (job: JobWithId, error: string): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Errored, completedAt: new Date(), error } })
}
const cancelPipeline = async (job: JobWithId): Promise<void> => {
  await jobCol.updateMany(
    { pipeline: job.pipeline, status: { '$in': [JobStatus.Waiting, JobStatus.Ready, JobStatus.Running] } },
    { $set: { status: JobStatus.Errored, error: 'Pipeline aborted' } }
  )
}

const updateReadyStatus = async (): Promise<void> => {
  const waitingJobs = await readAllFromCursor(
    jobCol.find({ status: JobStatus.Waiting })
  )
  for (const job of waitingJobs) {
    const dependencies = await readAllFromCursor(
      jobCol.find({ pipeline: job.pipeline, type: { $in: job.dependsOn } })
    )
    const ready = dependencies.every((d) => d.status === JobStatus.Completed)
    if (ready) {
      await saveReady(job)
    }
  }
}

const findNextJob = async (): Promise<JobWithId | undefined> => {
  const order: [keyof Job, 'asc' | 'desc'][] = [['queuedAt', 'asc']]

  // Find already running jobs (in case this job runner has restarted)
  const reserved = await readAllFromCursor(
    jobCol.find({ status: { $in: [JobStatus.Ready, JobStatus.Running] }, runnerId }, { sort: order })
  )
  const running = reserved.find((j) => j.status === JobStatus.Running)
  if (running) return running
  const ready = reserved.find((j) => j.status === JobStatus.Ready)
  if (ready) return ready

  // Atomically find and reserve next job
  const next = await jobCol.findOneAndUpdate({ status: JobStatus.Ready, runnerId: { $exists: false } }, { '$set': { runnerId } })
  if (next.ok && next.value) {
    return next.value
  }

  return undefined
}

const startJob = async (runner: JobRunner, job: JobWithId): Promise<void> => {
  console.log(`[job runner] Starting job ${job.type} for ${job.data.repoUrl}... (pipeline ${job.pipeline})`)
  const start = performance.now()

  await saveStartedAt(job)
  await runner.start(job)
  await saveRunning(job)

  console.log(`[job runner] Started job ${job.type} for ${job.data.repoUrl} in ${formatTime(start)}.`)
}

const waitJob = async (runner: JobRunner, job: JobWithId): Promise<void> => {
  console.log(`[job runner] Waiting job ${job.type} for ${job.data.repoUrl}... (pipeline ${job.pipeline})`)
  const start = performance.now()

  const checkPipelineErrored = async () => {
    const cur = await getJob(job._id)
    if (!cur || cur.status === JobStatus.Errored) {
      await runner.kill(job)
      throw new Error('Aborted due to pipeline error')
    }
  }

  let backoff = backoffStart
  while (!(await runner.isFinished(job))) {
    await checkPipelineErrored()
    await sleep(backoff)
    backoff = nextBackoff(backoff, activeBackoffMax)
    await checkPipelineErrored()
  }
  await saveCompleted(job)

  console.log(`[job runner] Finished job ${job.type} for ${job.data.repoUrl} in ${formatTime(start)}.`)
}

export const runJobLoop = async () => {
  console.log(`[job runner] Starting loop...`)

  let backoff = backoffStart
  while (true) {
    await updateReadyStatus()
    const job = await findNextJob()
    if (!job) {
      await sleep(backoff)
      backoff = nextBackoff(backoff, idleBackoffMax)
      continue
    }
    backoff = backoffStart

    const runner = jobRunners[job.type]
    if (!runner) {
      console.log(`[job runner] Error: unknown job type ${job.type}, skipping`)
      await saveErrored(job, `unknown job type`)
      continue
    }

    if (job.skip) {
      await saveCompleted(job)
      continue
    }

    try {
      if (job.status === JobStatus.Ready) {
        await startJob(runner, job)
      } else if (job.status === JobStatus.Running) {
        await waitJob(runner, job)
      } else {
        console.log(`[job runner] Unexpected job status ${job.status}, skipping`)
      }
    } catch (e: any) {
      console.log(`[job runner] Encountered an error while running job ${job.type} for ${job.data.repoUrl}, skipping`)
      console.trace(e)
      await saveErrored(job, `Runtime error: ${e.message}`)
      await cancelPipeline(job)
    }
  }
}

makeMissingDirs()
runJobLoop()
