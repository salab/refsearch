import { Express } from 'express'
import { deleteDocumentHandler, retrieveDocumentHandler, searchRequestHandler } from './common.js'
import { commitsCol, jobWithData, refCol, repoCol, toolRawDataCol } from '../../mongo.js'
import { retryJob, scheduleJob } from './jobs.js'
import {
  deleteCommitHandler,
  deleteRefactoringHandler,
  deleteRepositoryHandler,
} from './delete.js'
import { deleteToolCacheHandler, importToolCacheHandler } from './tool-caches.js'

export const registerRoutes = (app: Express): void => {
  app.get('/api/refactorings', searchRequestHandler(refCol, 'commit.date'))
  app.get('/api/refactorings/:id', retrieveDocumentHandler(refCol))
  app.delete('/api/refactorings/:id', deleteDocumentHandler(deleteRefactoringHandler))
  app.get('/api/commits', searchRequestHandler(commitsCol, 'date'))
  app.get('/api/commits/:id', retrieveDocumentHandler(commitsCol))
  app.delete('/api/commits/:id', deleteDocumentHandler(deleteCommitHandler))
  app.get('/api/repositories', searchRequestHandler(repoCol, '_id'))
  app.get('/api/repositories/:id', retrieveDocumentHandler(repoCol))
  app.delete('/api/repositories/:id', deleteDocumentHandler(deleteRepositoryHandler))

  app.get('/api/tool-caches', searchRequestHandler(toolRawDataCol, 'commit'))
  app.post('/api/tool-caches', importToolCacheHandler)
  app.delete('/api/tool-caches', deleteToolCacheHandler)

  app.get('/api/jobs', searchRequestHandler(jobWithData, '_id'))
  app.post('/api/jobs', scheduleJob)
  app.get('/api/jobs/:id', retrieveDocumentHandler(jobWithData))
  app.post('/api/jobs/:id/retry', retryJob)
}
