import {Job, JobRunner, jobRunners, JobStatus} from "../type";
import {jobCol} from "../mongo";
import {WithId} from "mongodb";
import {makeMissingDirs} from "../ingester/info";
import {formatTime} from "../../../common/utils";

type JobWithId = WithId<Job>

const backoffStart = 1000 // ms
const backoffMax = 60 * 1000
const nextBackoff = (prev: number): number => Math.min(backoffMax, prev * 2)
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const saveStarted = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Running, startedAt: new Date() } })
}
const saveFinished = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Completed, completedAt: new Date() } })
}
const saveErrored = async (job: JobWithId, error: string): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Errored, error } })
}
const cancelPipeline = async (job: JobWithId): Promise<void> => {
  await jobCol.updateMany(
    { pipeline: job.pipeline, status: { '$in': [JobStatus.Waiting, JobStatus.Running] } },
    { $set: { status: JobStatus.Errored, error: 'Pipeline aborted' } }
  )
}

const startJob = async (runner: JobRunner, job: JobWithId): Promise<void> => {
  console.log(`[job runner] Starting job ${job.type} for ${job.repoUrl}...`)
  const start = performance.now()

  await runner.start(job.repoUrl)
  await saveStarted(job)

  console.log(`[job runner] Started job ${job.type} for ${job.repoUrl} in ${formatTime(start)}.`)
}

const waitJob = async (runner: JobRunner, job: JobWithId): Promise<void> => {
  console.log(`[job runner] Waiting job ${job.type} for ${job.repoUrl}...`)
  const start = performance.now()

  let backoff = backoffStart
  while (!(await runner.isFinished(job.repoUrl))) {
    await sleep(backoff)
    backoff = nextBackoff(backoff)
  }
  await saveFinished(job)

  console.log(`[job runner] Finished job ${job.type} for ${job.repoUrl} in ${formatTime(start)}.`)
}

const findNextJob = async (): Promise<JobWithId | undefined> => {
  const order: [keyof Job, 'asc' | 'desc'][] = [['queuedAt', 'asc'], ['pipeline', 'asc'], ['pipelineOrder', 'asc']]
  const running = await jobCol.findOne({ status: JobStatus.Running }, { sort: order })
  if (running) return running
  const waiting = await jobCol.findOne({ status: JobStatus.Waiting }, { sort: order })
  if (waiting) return waiting
  return undefined
}

export const runJobLoop = async () => {
  console.log(`[job runner] Starting loop...`)

  let backoff = backoffStart
  while (true) {
    const job = await findNextJob()
    if (!job) {
      await sleep(backoff)
      backoff = nextBackoff(backoff)
      continue
    }
    backoff = backoffStart

    const runner = jobRunners[job.type]
    if (!runner) {
      console.log(`[job runner] Error: unknown job type ${job.type}, skipping`)
      await saveErrored(job, `unknown job type`)
      continue
    }

    try {
      if (job.status === JobStatus.Running) {
        await waitJob(runner, job)
      } else {
        await startJob(runner, job)
      }
    } catch (e: any) {
      console.log(`[job runner] Encountered an error while running job ${job.type} for ${job.repoUrl}, skipping`)
      console.trace(e)
      await saveErrored(job, `Runtime error: ${e.message}`)
      await cancelPipeline(job)
    }
  }
}

makeMissingDirs()
runJobLoop()
