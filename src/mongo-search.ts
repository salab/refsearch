import {RefactoringWithAdditionalInfo} from "./types.js";
import {ParseException, strToMongoQuery} from "./query-string.js";
import {sshUrlToHttpsUrl} from "./utils.js";
import {refCol} from "./mongo.js";

const queryExamples = {
    // Use-case 1: 重複の処理が無いextract
    useCase1: 'type = "Extract Method" & additional.sourceMethodsCount > 1',
    // Use-case 2: 数行のみのextract,  extractする前の行数
    useCase2: 'type = "Extract Method" & additional.extractedLines >= 3'
    // TODO: Use-case 3: 具体的なrenameした単語
} as const

// console.log(JSON.stringify(strToMongoQuery(queryExamples.useCase1))) // debug

const compiledQuery = strToMongoQuery(queryExamples.useCase1)
if (ParseException.is(compiledQuery)) {
    console.log(`Query compile error: ${compiledQuery.message}`)
    process.exit(1)
}

const cursor = refCol.find(compiledQuery)
const got: RefactoringWithAdditionalInfo[] = []
await cursor.forEach((r) => {
    got.push(r)
})

got.forEach((res, i) => {
    console.log(`-- Search result ${i+1}`)
    console.log(`URL: ${sshUrlToHttpsUrl(res.url)}`)
    console.log(`Desc: ${res.description}`)
})

process.exit(0)
