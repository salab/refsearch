import { RMRefactoring } from '../../../common/rminer.js'
import { toolRawDataCol } from '../mongo.js'
import { detectRMinerRefactorings } from '../api/tools/rminer.js'
import { PureRefactoringMeta } from '../../../common/common.js'
import { processRMinerOutput } from './rminer-process.js'

const toolName = 'RefactoringMiner'
const timeoutSeconds = 60

const getOrRun = async (repoUrl: string, commit: string): Promise<RMRefactoring[]> => {
  const rawData = await toolRawDataCol.findOne({ commit: commit, tool: toolName })
  if (rawData) return rawData.data as RMRefactoring[]

  const refs = await detectRMinerRefactorings(repoUrl, commit, timeoutSeconds)

  const insertRes = await toolRawDataCol.replaceOne(
    { commit: commit, tool: toolName },
    { commit: commit, tool: toolName, data: refs },
    { upsert: true },
  )
  if (!insertRes.acknowledged) throw new Error('Failed to insert rminer raw data')

  return refs
}

export const pluginRMinerMain = async (repoUrl: string, commit: string): Promise<PureRefactoringMeta[]> => {
  const refs = await getOrRun(repoUrl, commit)
  return processRMinerOutput(refs)
}
