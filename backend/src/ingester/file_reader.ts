import {refDiffFileName, rminerFileName} from "../info";
import fs from "fs";
import {RMOutput} from "../../../common/rminer";
import {refCol} from "../mongo";
import {RefDiffOutput} from "../../../common/refdiff";
import {processRMinerOutput} from "./processor/rminer";
import {processRefDiffOutput} from "./processor/refdiff";
import {formatTime} from "../utils";

export const ingestRMinerFile = async (repoUrl: string): Promise<void> => {
  const filename = rminerFileName(repoUrl)
  console.log(`Processing RMiner output file ${filename}...`)
  const start = performance.now()

  const output = JSON.parse(fs.readFileSync(filename).toString()) as RMOutput
  const refactorings = processRMinerOutput(output)
  const res = await refCol.insertMany(refactorings)

  console.log(`Processed ${output.commits.length} commits, and inserted ${res.insertedCount} refactoring instances in ${formatTime(start)}.`)
}

export const ingestRefDiffFile = async (repoUrl: string): Promise<void> => {
  const filename = refDiffFileName(repoUrl)
  console.log(`Processing RefDiff output file ${filename}...`)
  const start = performance.now()

  const output = JSON.parse(fs.readFileSync(filename).toString()) as RefDiffOutput
  const refactorings = processRefDiffOutput(repoUrl, output)
  const res = await refCol.insertMany(refactorings)

  console.log(`Inserted ${res.insertedCount} refactoring instances in ${formatTime(start)}.`)
}
