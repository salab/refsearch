import { jobCol, jobDataCol } from '../mongo.js'
import { makeMissingDirs } from '../jobs/info.js'
import { formatTime } from '../../../common/utils.js'
import { readAllFromCursor, sleep } from '../utils.js'
import { Job, JobData, JobStatus } from '../../../common/jobs.js'
import { JobRunner, jobRunners, JobWithId } from '../jobs.js'
import { config, validateRunnerConfig } from '../config.js'

const backoffStart = 1000 // ms
const idleBackoffMax = 60 * 1000
const nextBackoff = (prev: number, max: number): number => Math.min(max, prev * 1.5)

const saveReady = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Ready } })
}
const saveRunning = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Running, startedAt: new Date() } })
}
const saveCompleted = async (job: JobWithId): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Completed, completedAt: new Date() } })
}
const saveErrored = async (job: JobWithId, error: string): Promise<void> => {
  await jobCol.updateOne({ _id: job._id }, { $set: { status: JobStatus.Errored, completedAt: new Date(), error } })
}

const updateReadyStatus = async (): Promise<void> => {
  const waitingJobs = await readAllFromCursor(
    jobCol.find({ status: JobStatus.Waiting }),
  )
  for (const job of waitingJobs) {
    const dependencies = await readAllFromCursor(
      jobCol.find({ pipeline: job.pipeline, type: { $in: job.dependsOn } }),
    )
    const ready = dependencies.every((d) => d.status === JobStatus.Completed)
    if (ready) {
      await saveReady(job)
    }
  }
}

const findJobData = async (pipelineId: string): Promise<JobData | null> => {
  return jobDataCol.findOne({ _id: pipelineId })
}

const findNextJob = async (): Promise<JobWithId | undefined> => {
  const order: [keyof Job, 'asc' | 'desc'][] = [['queuedAt', 'asc']]

  // Find already running jobs (in case this job runner has restarted)
  const reserved = await readAllFromCursor(
    jobCol.find({ status: { $in: [JobStatus.Ready, JobStatus.Running] }, runnerId: config.runnerId }, { sort: order }),
  )
  const running = reserved.find((j) => j.status === JobStatus.Running)
  if (running) return running
  const ready = reserved.find((j) => j.status === JobStatus.Ready)
  if (ready) return ready

  // Atomically find and reserve next job
  const next = await jobCol.findOneAndUpdate({
    status: JobStatus.Ready,
    runnerId: { $exists: false },
  }, { '$set': { runnerId: config.runnerId } })
  if (next.ok && next.value) {
    return next.value
  }

  return undefined
}

const startJob = async (runner: JobRunner, job: JobWithId, jobData: JobData): Promise<void> => {
  console.log(`[job runner] Started job ${job.type} for ${jobData.repoUrl}... (pipeline ${job.pipeline})`)
  const start = performance.now()

  if (job.status !== JobStatus.Running) {
    // If job runner has restarted, save startedAt value
    await saveRunning(job)
  }
  await runner.run(job, jobData)
  await saveCompleted(job)

  console.log(`[job runner] Finished job ${job.type} for ${jobData.repoUrl} in ${formatTime(start)}.`)
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

    const jobData = await findJobData(job.pipeline)
    if (jobData === null) {
      console.log(`[job runner] Error: failed to find job data for pipeline id ${job.pipeline}, skipping`)
      await saveErrored(job, 'unknown job data')
      continue
    }

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
      switch (job.status) {
        case JobStatus.Ready:
        case JobStatus.Running:
          await startJob(runner, job, jobData)
          break
        default:
          console.log(`[job runner] Unexpected job status ${job.status}, skipping`)
      }
    } catch (e: any) {
      console.log(`[job runner] Encountered an error while running job ${job.type} for ${jobData.repoUrl}, skipping`)
      console.trace(e)
      await saveErrored(job, `Runtime error: ${e.message}`)
    }
  }
}

validateRunnerConfig()
makeMissingDirs()
runJobLoop()
