import { JobWithId } from '../jobs.js'
import { commitsCol, refCol } from '../mongo.js'
import { commitUrl, readAllFromCursor } from '../utils.js'
import {
  mergeCommitMetadataIntoRefactorings,
  updateCommitRefactoringMetadata,
  updateCommitToolsMetadata,
} from './metadata.js'
import { formatTime } from '../../../common/utils.js'
import { commitPlaceholder, CommitProcessState, PureRefactoringMeta, RefactoringMeta } from '../../../common/common.js'
import { JobData } from '../../../common/jobs.js'
import { config } from '../config.js'

type Commit = string

const processCommit = async (repoUrl: string, commit: Commit, tools: Record<string, CommitProcessState>, retryError: boolean) => {
  const newTools = Object.assign({}, tools)

  for (const [tool, plugin] of Object.entries(config().tool.plugins)) {
    const toProcess = !(tool in tools) || retryError && tools[tool] === CommitProcessState.NG
    if (!toProcess) continue

    try {
      const start = performance.now()

      const pureRefs = await plugin.run(repoUrl, commit)
      await updateCommitToolsMetadata(commit, newTools)
      await transformAndInsertRefactorings(repoUrl, commit, tool, pureRefs)

      newTools[tool] = CommitProcessState.OK
      console.log(` -> ${tool} in ${formatTime(start)}`)
    } catch (e) {
      console.log(` -> ${tool} errored`)
      console.trace(e)
      newTools[tool] = CommitProcessState.NG
    }
  }
}

export const transformAndInsertRefactorings = async (repoUrl: string, commit: string, toolName: string, pureRefs: PureRefactoringMeta[]): Promise<{ insertedCount: number }> => {
  const refactorings = pureRefs.map((r): RefactoringMeta => {
    return {
      ...r,
      sha1: commit,
      repository: repoUrl,
      url: commitUrl(repoUrl, commit),
      meta: {
        tool: toolName,
      },
      commit: commitPlaceholder(),
    }
  })

  let insertedCount = 0
  if (refactorings.length > 0) { // Running insertMany with empty array results in an error
    const insertRes = await refCol.insertMany(refactorings)
    insertedCount = insertRes.insertedCount
  }

  await updateCommitRefactoringMetadata(commit)
  await mergeCommitMetadataIntoRefactorings(commit)

  return { insertedCount }
}

export const processCommits = async (job: JobWithId, jobData: JobData) => {
  const commits = await readAllFromCursor(
    commitsCol.find({ repository: jobData.repoUrl }, { projection: { _id: 1, tools: 1 }, sort: { date: 1 } }),
  ).then((res) => res.map((doc) => ({ id: doc._id, tools: doc.tools })))

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    const skip = Object.keys(config().tool.plugins).every((tool) => commit.tools[tool] === CommitProcessState.OK)
    if (skip) continue

    console.log(`[${i + 1} / ${commits.length}] ${commit.id}`)
    await processCommit(jobData.repoUrl, commit.id, commit.tools, jobData.retryFailed)
  }
}
