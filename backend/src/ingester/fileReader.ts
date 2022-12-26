import {refDiffFileName, rminerFileName} from "./info";
import fs from "fs";
import {RMOutput} from "../../../common/rminer";
import {refCol} from "../mongo";
import {RefDiffOutput} from "../../../common/refdiff";
import {processRMinerOutput} from "./processor/rminer";
import {processRefDiffOutput} from "./processor/refdiff";

export const ingestRMinerFile = async (repoUrl: string): Promise<void> => {
  const filename = rminerFileName(repoUrl)
  const output = JSON.parse(fs.readFileSync(filename).toString()) as RMOutput
  const refactorings = processRMinerOutput(output)
  const res = await refCol.insertMany(refactorings as any)

  console.log(`[reader > rminer] Processed ${output.commits.length} commits and inserted ${res.insertedCount} refactoring instances.`)
}

export const ingestRefDiffFile = async (repoUrl: string): Promise<void> => {
  const filename = refDiffFileName(repoUrl)
  const output = JSON.parse(fs.readFileSync(filename).toString()) as RefDiffOutput
  const refactorings = processRefDiffOutput(repoUrl, output)
  const res = await refCol.insertMany(refactorings as any)

  console.log(`[reader > refdiff] Processed ${output.length} commits and inserted ${res.insertedCount} refactoring instances.`)
}
