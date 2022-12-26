import {runRefDiff, runRefDiffFinished, runRMiner, runRMinerFinished} from "./ingester/runner";
import {ingestRefDiffFile, ingestRMinerFile} from "./ingester/fileReader";
import {storeMetadata} from "./ingester/metadata";

export enum JobStatus {
  Waiting = 'waiting',
  Running = 'running',
  Completed = 'completed',
  Errored = 'errored',
}

export enum JobType {
  RunRMiner = 'runRMiner',
  RunRefDiff = 'runRefDiff',
  IngestRMiner = 'ingestRMiner',
  IngestRefDiff = 'ingestRefDiff',
  StoreMetadata = 'storeMedata',
}

export const jobOrder: JobType[] = [
  JobType.RunRMiner,
  JobType.RunRefDiff,
  JobType.IngestRMiner,
  JobType.IngestRefDiff,
  JobType.StoreMetadata,
]

export interface JobRunner {
  start: (repoUrl: string) => Promise<void>
  isFinished: (repoUrl: string) => Promise<boolean>
}
const finished = () => Promise.resolve(true)
export const jobRunners: Record<JobType, JobRunner> = {
  runRMiner: { start: runRMiner, isFinished: runRMinerFinished },
  runRefDiff: { start: runRefDiff, isFinished: runRefDiffFinished },
  ingestRMiner: { start: ingestRMinerFile, isFinished: finished },
  ingestRefDiff: { start: ingestRefDiffFile, isFinished: finished },
  storeMedata: { start: storeMetadata, isFinished: finished },
}

export interface Job {
  repoUrl: string
  type: JobType
  status: JobStatus
  order: number
  queuedAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}
