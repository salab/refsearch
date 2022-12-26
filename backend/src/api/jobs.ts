import {Request, Response} from "express";
import {Job, JobStatus, JobType, pipelines} from "../type";
import {jobCol} from "../mongo";
import {randomUUID} from "crypto";

interface ScheduleJobRequest extends Request {
  body: {
    repoUrl: string
    skip: JobType[]
  }
}

export const scheduleJob = async (req: ScheduleJobRequest, res: Response) => {
  // Bind and validate
  req.body.skip ||= []
  const invalidSkip = req.body.skip.find((j) => Object.values(JobType).includes(j))
  if (invalidSkip) {
    return res.status(400).json({ message: `skip "${invalidSkip}" is invalid` })
  }
  if (!req.body.repoUrl) {
    return res.status(400).json({ message: 'repoUrl is required' })
  }

  // Process
  const now = new Date()
  const newJobs = pipelines.flatMap((pipeline) => {
    const pipelineId = randomUUID()
    return pipeline
      .filter((jobType) => !req.body.skip.includes(jobType))
      .map((jobType, i): Job => ({
        repoUrl: req.body.repoUrl,
        pipeline: pipelineId,
        pipelineOrder: i+1,
        type: jobType,
        status: JobStatus.Waiting,
        queuedAt: now,
      }))
  })
  const insertResult = await jobCol.insertMany(newJobs)

  if (!insertResult.acknowledged) {
    return res.status(500).json({ message: 'Something went wrong while queuing jobs' })
  }

  return res.status(200).json({ message: `Queued ${insertResult.insertedCount} jobs` })
}
