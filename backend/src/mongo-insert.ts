import fs from "fs";
import {extractMethodExtractedLines, extractSourceMethodsCount} from "./extractor";
import {refCol} from "./mongo";
import {RMOutput, RMRefactoringType} from "../../types/rminer";
import {Commit, Refactoring} from "../../types/types";
import {sshUrlToHttpsUrl} from "./utils";

const processRMinerFile = async (filename: string): Promise<void> => {
  console.log(`Processing RMiner output file ${filename}...`)

  const file = fs.readFileSync(filename).toString()
  const output = JSON.parse(file) as RMOutput
  const commits = output.commits
    .map((c): Commit => {
      // Normalize to https url for convenience
      const url = sshUrlToHttpsUrl(c.url)
      const repository = sshUrlToHttpsUrl(c.repository)
      return {
        ...c,
        url,
        repository,
        refactorings: c.refactorings
          .map((r): Refactoring => ({
            ...r,
            url,
            repository,
            sha1: c.sha1,
            extractMethod: {}
          }))
      }
    })

  // Pre-compute needed information
  // Use-case 1: 重複の処理が無い / あるextract
  commits.forEach((c) => extractSourceMethodsCount(c))

  // Use-case 2: 数行のみのextract,  extractする前の行数
  commits.forEach((c) =>
    c.refactorings
      .filter((r) => r.type === RMRefactoringType.ExtractMethod)
      .forEach((r) => {
        r.extractMethod.extractedLines = extractMethodExtractedLines(r)
      }))

  const refactorings = commits.flatMap((c) => c.refactorings)
  const res = await refCol.insertMany(refactorings)
  console.log(`${commits.length} commits processed, ${res.insertedCount} documents inserted`)
}

const main = async () => {
  const files = fs.readdirSync('./data/rminer')
  for (const file of files) {
    await processRMinerFile(`./data/rminer/${file}`)
  }

  process.exit(0)
}

main()
