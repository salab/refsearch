import {refCol, toolRawDataCol} from "../../mongo";
import {RefDiffRefactoring} from "../../../../common/refdiff";
import {processRefDiffOutput} from "../processor/refdiff";
import {detectRefDiffRefactorings} from "../../api/tools/refdiff";

export const refDiffToolName = 'RefDiff'
const timeoutSeconds = 60

const getOrRun = async (repoUrl: string, commit: string): Promise<RefDiffRefactoring[]> => {
  const rawData = await toolRawDataCol.findOne({ commit: commit, tool: refDiffToolName })
  if (rawData) return rawData.data as RefDiffRefactoring[]

  const refs = await detectRefDiffRefactorings(repoUrl, commit, timeoutSeconds)

  const insertRes = await toolRawDataCol.replaceOne(
    { commit: commit, tool: refDiffToolName },
    { commit: commit, tool: refDiffToolName, data: refs },
    { upsert: true }
  )
  if (!insertRes.acknowledged) throw new Error('Failed to insert refdiff raw data')

  return refs
}

export const processRefDiff = async (repoUrl: string, commit: string): Promise<void> => {
  const refs = await getOrRun(repoUrl, commit)
  const processed = processRefDiffOutput(repoUrl, [{ sha1: commit, refactorings: refs }])
  if (processed.length > 0) await refCol.insertMany(processed)
}
