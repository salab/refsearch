import { RefDiffRefactoring } from '../../../common/refdiff.js'
import { toolRawDataCol } from '../mongo.js'
import { detectRefDiffRefactorings } from '../api/tools/refdiff.js'
import { PureRefactoringMeta } from '../../../common/common.js'
import { processRefDiffOutput } from './refdiff-process.js'

const toolName = 'RefDiff'
const timeoutSeconds = 60

const getOrRun = async (repoUrl: string, commit: string): Promise<RefDiffRefactoring[]> => {
  const rawData = await toolRawDataCol.findOne({ commit: commit, tool: toolName })
  if (rawData) return rawData.data as RefDiffRefactoring[]

  const refs = await detectRefDiffRefactorings(repoUrl, commit, timeoutSeconds)

  const insertRes = await toolRawDataCol.replaceOne(
    { commit: commit, tool: toolName },
    { commit: commit, tool: toolName, data: refs },
    { upsert: true },
  )
  if (!insertRes.acknowledged) throw new Error('Failed to insert refdiff raw data')

  return refs
}

export const pluginRefDiffMain = async (repoUrl: string, commit: string): Promise<PureRefactoringMeta[]> => {
  const refs = await getOrRun(repoUrl, commit)
  return processRefDiffOutput(refs)
}
