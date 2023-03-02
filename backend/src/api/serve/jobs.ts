import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { ObjectId } from 'mongodb'
import { Job, JobCommit, JobData, JobStatus, JobType } from '../../../../common/jobs.js'
import { jobCol, jobDataCol } from '../../mongo.js'
import { jobRunners } from '../../jobs.js'

interface ScheduleJobRequest extends Request {
  body: {
    repoUrl: string
    skip: JobType[]
    commits?: JobCommit
  }
}

export const scheduleJob = async (req: ScheduleJobRequest, res: Response) => {
  // Bind and validate
  if (!req.body.repoUrl) {
    return res.status(400).json({ message: 'repoUrl is required' })
  }

  req.body.skip ||= []
  const invalidSkip = req.body.skip.find((j) => !Object.values(JobType).includes(j))
  if (invalidSkip) {
    return res.status(400).json({ message: `skip "${invalidSkip}" is invalid` })
  }

  let commits: JobCommit
  switch (req.body.commits?.type) {
    case 'one':
      if (!req.body.commits.sha1) {
        return res.status(400).json({ message: 'commits.sha1 is required when commits.type is one' })
      }
      commits = { type: 'one', sha1: req.body.commits.sha1 }
      break
    case 'range':
      if (!req.body.commits.from) {
        return res.status(400).json({ message: 'commits.from is required when commits.type is range' })
      }
      commits = { type: 'range', from: req.body.commits.from, to: req.body.commits.to }
      break
    case 'all':
      commits = { type: 'all'}
      break
    default:
      return res.status(400).json({ message: 'commits.all is not one of "one", "range", or "all"' })
  }

  // Process
  const now = new Date()
  const pipelineId = randomUUID()
  const newJobs = Object.values(JobType)
    .map((jobType): Job => ({
      pipeline: pipelineId,
      skip: req.body.skip.includes(jobType),
      type: jobType,
      status: JobStatus.Waiting,
      dependsOn: jobRunners[jobType].dependsOn,
      queuedAt: now,
    }))
  const jobData: JobData = {
    _id: pipelineId,
    repoUrl: req.body.repoUrl,
    commits,
  }

  const insertResult = await jobCol.insertMany(newJobs)
  if (!insertResult.acknowledged) {
    return res.status(500).json({ message: 'Something went wrong while queuing jobs' })
  }
  const dataInsertResult = await jobDataCol.insertOne(jobData)
  if (!dataInsertResult.acknowledged) {
    return res.status(500).json({ message: 'Something went wrong while queuing jobs' })
  }

  return res.status(200).json({ message: `Queued ${insertResult.insertedCount} jobs` })
}

export const retryJob = async (req: Request, res: Response) => {
  let id: ObjectId
  try {
    id = new ObjectId(req.params.id)
  } catch (e) {
    return res.status(400).json({ message: 'Malformed id' })
  }
  const updateResult = await jobCol.updateOne({ _id: id },
    {
      $set: {
        status: JobStatus.Waiting,
        queuedAt: new Date(),
      },
      $unset: {
        startedAt: '',
        completedAt: '',
        error: '',
      },
    },
  )
  if (!updateResult.acknowledged) {
    return res.status(500).json({ message: 'Internal update error' })
  }
  return res.status(200).json({ message: `Modified ${updateResult.modifiedCount} document(s)` })
}
