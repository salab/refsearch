export enum JobStatus {
  Waiting = 'waiting',     // Waiting for dependencies to be done
  Ready = 'ready',         // All dependencies are done, ready to be run
  Running = 'running',     // Running
  Completed = 'completed', // Completed
  Errored = 'errored',     // Encountered error(s) while running
}

export enum JobType {
  CloneRepo = 'cloneRepo',
  StoreCommits = 'storeCommits',
  ProcessCommits = 'processCommits',
  StoreRepo = 'storeRepo',
}

export interface JobData {
  repoUrl: string
}

export interface Job {
  data: JobData
  pipeline: string
  skip: boolean
  runnerId?: string
  type: JobType
  status: JobStatus
  dependsOn: JobType[]
  queuedAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export type JobWithStrId = { _id: string } & Job
