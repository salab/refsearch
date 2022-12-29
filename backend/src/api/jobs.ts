import {Request, Response} from "express";
import {jobCol} from "../mongo";
import {randomUUID} from "crypto";
import {Job, JobStatus, JobType} from "../../../common/jobs";
import {jobRunners} from "../jobs";

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
