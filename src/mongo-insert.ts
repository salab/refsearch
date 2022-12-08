import fs from "fs";
import {CommitWithAdditionalInfo, RefactoringWithAdditionalInfo, RMOutput} from "./types.js";
import {extractMethodExtractedLines, extractSourceMethodsCount} from "./extractor.js";
import {RMRefactoringType} from "./consts.js";
import {refCol} from "./mongo.js";

const processRMinerFile = async (filename: string): Promise<void> => {
    console.log(`Processing RMiner output file ${filename}...`)

    const file = fs.readFileSync(filename).toString()
    const output = JSON.parse(file) as RMOutput
    const commits = output.commits
        .map((c): CommitWithAdditionalInfo => {
            return {
                ...c,
                refactorings: c.refactorings
                    .map((r): RefactoringWithAdditionalInfo => ({
                        ...r,
                        url: c.url,
                        sha1: c.sha1,
                        repository: c.repository,
                        additional: {}
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
                r.additional.extractedLines = extractMethodExtractedLines(r)
            }))

    const refactorings = commits.flatMap((c) => c.refactorings)
    const res = await refCol.insertMany(refactorings)
    console.log(`${commits.length} commits processed, ${res.insertedCount} documents inserted`)
}

const files = fs.readdirSync('./data/rminer')
for (const file of files) {
    await processRMinerFile(`./data/rminer/${file}`)
}

process.exit(0)
