import {runRefDiff, isRefDiffFinished, runRMiner, isRMinerFinished, killRMiner, killRefDiff} from "./ingester/runner";
import {ingestRefDiffFile, ingestRMinerFile} from "./ingester/fileReader";
import {storeMetadata} from "./ingester/metadata";
import {WithId} from "mongodb";
import {cloneRepository} from "./ingester/cloner";
import {Job, JobType} from "../../common/jobs";

export interface JobRunner {
  start: (job: JobWithId) => Promise<void>
  isFinished: (job: JobWithId) => Promise<boolean>
  kill: (job: JobWithId) => Promise<void>
  dependsOn: JobType[]
}
const finished = () => Promise.resolve(true)
const doNothing = () => Promise.resolve()
export const jobRunners: Record<JobType, JobRunner> = {
  cloneRepo: { start: cloneRepository, isFinished: finished, kill: doNothing, dependsOn: [] },
  runRMiner: { start: runRMiner, isFinished: isRMinerFinished, kill: killRMiner, dependsOn: [JobType.CloneRepo] },
  runRefDiff: { start: runRefDiff, isFinished: isRefDiffFinished, kill: killRefDiff, dependsOn: [JobType.CloneRepo] },
  ingestRMiner: { start: ingestRMinerFile, isFinished: finished, kill: doNothing, dependsOn: [JobType.RunRMiner] },
  ingestRefDiff: { start: ingestRefDiffFile, isFinished: finished, kill: doNothing, dependsOn: [JobType.RunRefDiff] },
  storeMetadata: { start: storeMetadata, isFinished: finished, kill: doNothing, dependsOn: [JobType.IngestRMiner, JobType.IngestRefDiff] },
}

export type JobWithId = WithId<Job>
