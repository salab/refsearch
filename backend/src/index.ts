import express, {Request} from "express";
import {ParseException, strToMongoQuery} from "./query-string";
import {refCol} from "./mongo";
import {ObjectId} from "mongodb";
import {Refactoring} from "../../types/types";

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
  const offset = Math.max(0, Number.parseInt(req.query.offset ?? '') || 0)

  const compiledQuery = strToMongoQuery(q)
  if (ParseException.is(compiledQuery)) {
    return res.status(400).json({message: 'Malformed query', details: compiledQuery.message})
  }

  const limitBulk = 10000
  const countLimit = limitBulk * Math.ceil((offset+limit) / limitBulk)
  const count = await refCol.countDocuments(compiledQuery, { limit: countLimit+1 })
  const hasMore = count > countLimit

  const cursor = refCol.find(compiledQuery)
  const refactorings: Refactoring[] = []
  cursor.skip(offset)
  cursor.limit(limit)
  await cursor.forEach((r) => {
    refactorings.push(r)
  })

  return res.status(200).json({
    total: {
      count: Math.min(count, countLimit),
      hasMore,
    },
    refactorings
  })
})

app.get('/api/refactorings/:rid', async (req, res) => {
  let rid: ObjectId
  try {
    rid = new ObjectId(req.params.rid)
  } catch (e: any) {
    if (e.name === 'BSONTypeError') {
      return res.status(400).json({message: 'Malformed id', details: e.message})
    } else {
      console.trace(e)
      return res.status(500)
    }
  }

  const ref = await refCol.findOne({_id: rid})
  if (!ref) {
    return res.status(404).json({
      message: 'Refactoring with given id not found'
    })
  }
  return res.status(200).json(ref)
})

app.listen(port, () => console.log(`API server started on port ${port}`))
