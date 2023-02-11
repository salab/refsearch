import {Request, Response} from "express";
import {randomUUID} from "crypto";
import {ObjectId} from "mongodb";
import {Job, JobStatus, JobType} from "../../../../common/jobs.js";
import {jobCol} from "../../mongo.js";
import {jobRunners} from "../../jobs.js";

interface ScheduleJobRequest extends Request {
  body: {
    repoUrl: string
    skip: JobType[]
  }
}

export const scheduleJob = async (req: ScheduleJobRequest, res: Response) => {
  // Bind and validate
  req.body.skip ||= []
  const invalidSkip = req.body.skip.find((j) => !Object.values(JobType).includes(j))
  if (invalidSkip) {
    return res.status(400).json({ message: `skip "${invalidSkip}" is invalid` })
  }
  if (!req.body.repoUrl) {
    return res.status(400).json({ message: 'repoUrl is required' })
  }

  // Process
  const now = new Date()
  const pipelineId = randomUUID()
  const newJobs = Object.values(JobType)
    .map((jobType): Job => ({
      data: {
        repoUrl: req.body.repoUrl,
      },
      pipeline: pipelineId,
      skip: req.body.skip.includes(jobType),
      type: jobType,
      status: JobStatus.Waiting,
      dependsOn: jobRunners[jobType].dependsOn,
      queuedAt: now,
    }))
  const insertResult = await jobCol.insertMany(newJobs)

  if (!insertResult.acknowledged) {
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
      }
    }
  )
  if (!updateResult.acknowledged) {
    return res.status(500).json({ message: 'Internal update error' })
  }
  return res.status(200).json({ message: `Modified ${updateResult.modifiedCount} document(s)` })
}
