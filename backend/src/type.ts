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
  StoreMetadata = 'storeMetadata',
}

export const pipelines: JobType[][] = [
  [
    JobType.RunRMiner,
    JobType.IngestRMiner,
    JobType.StoreMetadata,
  ],
  [
    JobType.RunRefDiff,
    JobType.IngestRefDiff,
    JobType.StoreMetadata,
  ],
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
  storeMetadata: { start: storeMetadata, isFinished: finished },
}

export interface Job {
  repoUrl: string
  pipeline: string
  pipelineOrder: number
  type: JobType
  status: JobStatus
  queuedAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}
