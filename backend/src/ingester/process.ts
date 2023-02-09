import {JobWithId} from "../jobs";
import {commitsCol} from "../mongo";
import {readAllFromCursor} from "../utils";
import {processRMiner, rminerToolName} from "./runner/rminer";
import {processRefDiff, refDiffToolName} from "./runner/refdiff";
import {mergeCommitMetadata, updateCommitMetadata} from "./metadata";
import {batch, formatTime, sequentialBatch} from "../../../common/utils";
import {CommitProcessState} from "../../../common/common";

type CommitId = string
type ToolName = string
type Processor = (repoUrl: string, commits: string[]) => Promise<Record<CommitId, CommitProcessState>>
const processors: Record<ToolName, Processor> = {
  [rminerToolName]: processRMiner,
  [refDiffToolName]: processRefDiff,
}

interface C { id: string, tools: Record<string, CommitProcessState> }

const processCommitsBatch = async (repoUrl: string, commits: C[], retryError: boolean) => {
  const toolResults: Record<ToolName, Record<CommitId, CommitProcessState>> = {}

  for (const [tool, process] of Object.entries(processors)) {
    toolResults[tool] = {}

    const batches = sequentialBatch(
      commits,
      (c) => !(tool in c.tools) || retryError && c.tools[tool] === CommitProcessState.NG
    ).map((b) => b.map((c) => c.id))

    for (const batch of batches) {
      try {
        const res = await process(repoUrl, batch)
        for (const [id, state] of Object.entries(res)) {
          toolResults[tool][id] = state
        }
      } catch (e) {
        console.log(`Error processing ${batch.length} commit(s) batch for ${tool} in ${repoUrl}`)
        console.trace(e)
        for (const id of batch) {
          toolResults[tool][id] = CommitProcessState.NG
        }
      }
    }
  }

  for (const c of commits) {
    const newTools = Object.assign({}, c.tools)
    for (const [tool, commits] of Object.entries(toolResults)) {
      if (c.id in commits) {
        newTools[tool] = commits[c.id]
      }
    }
    await updateCommitMetadata(c.id, newTools)
    await mergeCommitMetadata(c.id)
  }
}

const batchSize = 100

export const processCommits = async ({ data }: JobWithId) => {
  const commits = await readAllFromCursor(
    commitsCol.find({ repository: data.repoUrl }, { projection: { _id: 1, tools: 1 }, sort: { date: 1 } })
  ).then((res) => res.map((doc) => ({ id: doc._id, tools: doc.tools })))

  const batches = batch(commits, batchSize)
  for (let i = 0; i < batches.length; i++){
    const batchCommits = batches[i]
    const start = performance.now()

    await processCommitsBatch(data.repoUrl, batchCommits, false) // TODO: retry error option

    const done = Math.min(commits.length, (i+1)*batchSize)
    console.log(`[${done} / ${commits.length}] Processed ${batchCommits.length} commits in ${formatTime(start)}`)
  }
}
