import { Request, Response } from 'express'
import { syncDB, toolRawDataCol } from '../../mongo.js'

export const importToolCacheHandler = async (req: Request, res: Response) => {
  const body = req.body
  if (!Array.isArray(body)) {
    return res.status(400).json({
      message: 'body needs to be a json array of cache data',
    })
  }
  for (const cacheData of body) {
    if (typeof cacheData.commit !== 'string') {
      return res.status(400).json({
        message: '"commit" string field is required',
      })
    }
    if (typeof cacheData.tool !== 'string') {
      return res.status(400).json({
        message: '"tool" string field is required',
      })
    }
    if (typeof cacheData.data !== 'object') {
      return res.status(400).json({
        message: '"data" object field is required',
      })
    }
  }

  const cacheData = body.map((datum) => ({
    commit: datum.commit,
    tool: datum.tool,
    data: datum.data,
  }))
  try {
    const insertRes = await toolRawDataCol.insertMany(cacheData)
    if (!insertRes.acknowledged) {
      return res.status(500).json({
        message: 'Inserting data',
      })
    }
    return res.status(200).json({
      message: `Inserted ${insertRes.insertedCount} document(s)`,
    })
  } catch (e) {
    return res.status(500).json({
      message: 'Internal error',
    })
  }
}

export const deleteToolCacheHandler = async (req: Request, res: Response) => {
  const dropSuccess = await toolRawDataCol.drop()
  if (!dropSuccess) {
    return res.status(500).json({
      message: 'Internal error: dropping cache',
    })
  }
  await syncDB()
  return res.status(204).send()
}
