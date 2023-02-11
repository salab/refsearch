import {JobWithId} from "../jobs";
import {commitsCol} from "../mongo";
import {readAllFromCursor} from "../utils";
import {processRMiner, rminerToolName} from "./runner/rminer";
import {processRefDiff, refDiffToolName} from "./runner/refdiff";
import {mergeCommitMetadata, updateCommitMetadata} from "./metadata";
import {formatTime, shortSha} from "../../../common/utils";
import {CommitProcessState} from "../../../common/common";

type CommitId = string
type ToolName = string
type Processor = (repoUrl: string, commit: string) => Promise<void>
const processors: Record<ToolName, Processor> = {
  [rminerToolName]: processRMiner,
  [refDiffToolName]: processRefDiff,
}

const processCommit = async (repoUrl: string, commitId: CommitId, tools: Record<string, CommitProcessState>, retryError: boolean) => {
  const newTools = Object.assign({}, tools)
  
  for (const [tool, process] of Object.entries(processors)) {
    const toProcess = !(tool in tools) || retryError && tools[tool] === CommitProcessState.NG
    if (!toProcess) continue

    try {
      const start = performance.now()
      await process(repoUrl, commitId)
      newTools[tool] = CommitProcessState.OK
      console.log(` -> ${tool} in ${formatTime(start)}`)
    } catch (e) {
      console.log(` -> ${tool} errored`)
      console.trace(e)
      newTools[tool] = CommitProcessState.NG
    }
  }

  await updateCommitMetadata(commitId, newTools)
  await mergeCommitMetadata(commitId)
}

export const processCommits = async ({ data }: JobWithId) => {
  const commits = await readAllFromCursor(
    commitsCol.find({ repository: data.repoUrl }, { projection: { _id: 1, tools: 1 }, sort: { date: 1 } })
  ).then((res) => res.map((doc) => ({ id: doc._id, tools: doc.tools })))

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    console.log(`[${i+1} / ${commits.length}] ${shortSha(commit.id)}`)
    await processCommit(data.repoUrl, commit.id, commit.tools, true) // TODO: retry error option
  }
}
