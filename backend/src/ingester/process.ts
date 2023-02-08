import {JobWithId} from "../jobs";
import {commitsCol} from "../mongo";
import {readAllFromCursor} from "../utils";
import {processRMiner, rminerToolName} from "./runner/rminer";
import {processRefDiff, refDiffToolName} from "./runner/refdiff";
import {mergeCommitMetadata, updateCommitMetadata} from "./metadata";
import {formatTime, shortSha} from "../../../common/utils";

type Processor = (repoUrl: string, commit: string) => Promise<void>
const processors: Record<string, Processor> = {
  [rminerToolName]: processRMiner,
  [refDiffToolName]: processRefDiff,
}

const processCommit = async (repoUrl: string, commit: string, tools: string[]) => {
  const processedTools = [...tools]
  for (const [tool, process] of Object.entries(processors)) {
    if (tools.includes(tool)) continue
    try {
      await process(repoUrl, commit)
      processedTools.push(tool)
    } catch (e) {
      console.log(`Error processing commit ${shortSha(commit)} for ${repoUrl}`)
      console.trace(e)
    }
  }
  await updateCommitMetadata(commit, processedTools)
  await mergeCommitMetadata(commit)
}

export const processCommits = async ({ data }: JobWithId) => {
  const commits = await readAllFromCursor(
    commitsCol.find({ repository: data.repoUrl }, { projection: { _id: 1, tools: 1 } })
  ).then((res) => res.map((doc) => ({ id: doc._id, tools: doc.tools })))

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    const start = performance.now()
    await processCommit(data.repoUrl, commit.id, commit.tools)
    console.log(`[${i+1} / ${commits.length}] ${shortSha(commit.id)} in ${formatTime(start)}`)
  }
}
