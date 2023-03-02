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

export interface JobCommitOne {
  type: 'one'
  sha1: string
}

export interface JobCommitRange {
  type: 'range'
  from: string // after in chronological order
  to?: string  // before in chronological order, exclusive
}

export interface JobCommitAll {
  type: 'all'
}

export type JobCommit = JobCommitOne | JobCommitRange | JobCommitAll

export interface JobData {
  _id: string // pipeline id
  repoUrl: string
  commits: JobCommit
  retryFailed: boolean
}

export interface Job {
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

export type JobWithData = Job & { data: JobData }

export type JobWithStrId = { _id: string } & JobWithData
