import {Request, Response} from "express";
import {Job, jobOrder, JobStatus, JobType} from "../type";
import {jobCol} from "../mongo";

interface ScheduleJobRequest extends Request {
  body: {
    repoUrl: string
    skip: JobType[]
  }
}

export const scheduleJob = async (req: ScheduleJobRequest, res: Response) => {
  // Bind and validate
  req.body.skip ||= []
  if (!req.body.repoUrl) {
    return res.status(400).json({ message: 'repoUrl is required' })
  }

  // Process
  const now = new Date()
  const newJobs = jobOrder
    .filter((jobType) => !req.body.skip.includes(jobType))
    .map((jobType, i): Job => ({
      repoUrl: req.body.repoUrl,
      type: jobType,
      status: JobStatus.Waiting,
      order: i+1,
      queuedAt: now,
    }))
  const insertResult = await jobCol.insertMany(newJobs)

  if (!insertResult.acknowledged) {
    return res.status(500).json({ message: 'Something went wrong while queuing jobs' })
  }

  return res.status(200).json({ message: `Queued ${insertResult.insertedCount} jobs` })
}
