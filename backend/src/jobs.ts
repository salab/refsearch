import {WithId} from "mongodb";
import {cloneRepository} from "./jobs/cloner.js";
import {Job, JobType} from "../../common/jobs.js";
import {storeCommitsMetadata, updateRepositoryMetadata} from "./jobs/metadata.js";
import {processCommits} from "./jobs/process.js";

export interface JobRunner {
  run: (job: JobWithId) => Promise<void>
  dependsOn: JobType[]
}
export const jobRunners: Record<JobType, JobRunner> = {
  cloneRepo: { run: cloneRepository, dependsOn: [] },
  storeCommits: { run: storeCommitsMetadata, dependsOn: [JobType.CloneRepo] },
  processCommits: { run: processCommits, dependsOn: [JobType.StoreCommits] },
  storeRepo: { run: updateRepositoryMetadata, dependsOn: [JobType.ProcessCommits] },
}

export type JobWithId = WithId<Job>
