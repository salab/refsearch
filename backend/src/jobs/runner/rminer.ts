import {refCol, toolRawDataCol} from "../../mongo.js";
import {RMRefactoring} from "../../../../common/rminer.js";
import {processRMinerOutput} from "../processor/rminer.js";
import {detectRMinerRefactorings} from "../../api/tools/rminer.js";
import {commitUrl} from "../../utils.js";

export const rminerToolName = 'RefactoringMiner'
const timeoutSeconds = 60

const getOrRun = async (repoUrl: string, commit: string): Promise<RMRefactoring[]> => {
  const rawData = await toolRawDataCol.findOne({ commit: commit, tool: rminerToolName })
  if (rawData) return rawData.data as RMRefactoring[]

  const refs = await detectRMinerRefactorings(repoUrl, commit, timeoutSeconds)

  const insertRes = await toolRawDataCol.replaceOne(
    { commit: commit, tool: rminerToolName },
    { commit: commit, tool: rminerToolName, data: refs },
    { upsert: true }
  )
  if (!insertRes.acknowledged) throw new Error('Failed to insert rminer raw data')

  return refs
}

export const processRMiner = async (repoUrl: string, commit: string): Promise<void> => {
  const refs = await getOrRun(repoUrl, commit)
  const processed = processRMinerOutput({commits: [{
      repository: repoUrl,
      sha1: commit,
      url: commitUrl(repoUrl, commit),
      refactorings: refs
    }]})
  if (processed.length > 0) await refCol.insertMany(processed)
}
