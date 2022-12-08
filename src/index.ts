import express, {Request} from "express";
import {ParseException, strToMongoQuery} from "./query-string.js";
import {RefactoringWithAdditionalInfo} from "./types.js";
import {refCol} from "./mongo.js";

const port: number = Number.parseInt(process.env.PORT ?? '') || 3000

const app = express()

interface GetRefactoringsRequest extends Request {
    query: {
        q?: string
        limit?: string
        offset?: string
    }
}

app.get('/api/refactorings', async (req: GetRefactoringsRequest, res) => {
    const q = req.query.q || ''
    const limit = Number.parseInt(req.query.limit ?? '') || 50
    const offset = Number.parseInt(req.query.offset ?? '') || 0

    console.log(`q: ${q}`)

    const compiledQuery = strToMongoQuery(q)
    if (ParseException.is(compiledQuery)) {
        res.status(400).json({ message: 'Malformed query', details: compiledQuery.message })
        return
    }

    const cursor = refCol.find(compiledQuery)
    const refactorings: RefactoringWithAdditionalInfo[] = []
    cursor.skip(offset)
    cursor.limit(limit+1)
    await cursor.forEach((r) => {
        refactorings.push(r)
    })
    const hasMore = refactorings.length > limit
    if (hasMore) {
        refactorings.pop()
    }

    res.status(200).json({
        hasMore,
        refactorings
    })
})

app.listen(port, () => console.log(`API server started on port ${port}`))
