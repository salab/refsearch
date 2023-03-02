import { Request, Response } from 'express'
import { Collection, Document, Filter, ObjectId } from 'mongodb'
import { strToMongoQuery } from './query-string.js'
import { readAllFromCursor } from '../../utils.js'
import { ParseException } from '../../../../common/parser/exception.js'

interface SearchRequest extends Request {
  query: {
    q?: string
    limit?: string
    offset?: string
    sort?: string
    order?: string
  }
}

export const searchRequestHandler = <T extends Document>(collection: Collection<T>, defaultSort: string) =>
  async (req: SearchRequest, res: Response) => {
    // Request
    const q = req.query.q || ''
    const limit = Number.parseInt(req.query.limit ?? '') || 50
    const offset = Math.max(0, Number.parseInt(req.query.offset ?? '') || 0)
    const sort = req.query.sort || defaultSort
    const order = req.query.order || 'desc'

    // Validate
    const compiledQuery = strToMongoQuery(q) as Filter<T>
    if (ParseException.is(compiledQuery)) {
      return res.status(400).json({ message: 'Malformed query', details: compiledQuery.message })
    }
    if (!['asc', 'desc'].includes(order)) {
      return res.status(400).json({ message: 'Invalid order', details: 'Order must be asc or desc' })
    }

    // Process
    const limitBulk = 10000
    const countLimit = limitBulk * Math.ceil((offset + limit) / limitBulk)
    const count = await collection.countDocuments(compiledQuery, { limit: countLimit + 1 })
    const hasMore = count > countLimit

    const cursor = collection.find(compiledQuery, { sort: { [sort]: order as 'asc' | 'desc' } })
    cursor.skip(offset)
    cursor.limit(limit)
    const result = await readAllFromCursor(cursor)

    return res.status(200).json({
      total: {
        count: Math.min(count, countLimit),
        hasMore,
      },
      result,
    })
  }

export const retrieveDocumentHandler = <T extends Document>(collection: Collection<T>) =>
  async (req: Request, res: Response) => {
    let id: ObjectId | string = req.params.id
    try {
      id = new ObjectId(id)
    } catch (e) {
      // ignore
    }
    const ref = await collection.findOne({ _id: id } as unknown as Filter<T>)
    if (!ref) {
      return res.status(404).json({
        message: 'Document not found',
      })
    }
    return res.status(200).json(ref)
  }
