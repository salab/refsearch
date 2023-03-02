import { Express } from 'express'
import { retrieveDocumentHandler, searchRequestHandler } from './common.js'
import { commitsCol, jobCol, refCol, repoCol } from '../../mongo.js'
import { retryJob, scheduleJob } from './jobs.js'

export const registerRoutes = (app: Express): void => {
  app.get('/api/refactorings', searchRequestHandler(refCol, 'commit.date'))
  app.get('/api/refactorings/:id', retrieveDocumentHandler(refCol))
  app.get('/api/commits', searchRequestHandler(commitsCol, 'date'))
  app.get('/api/commits/:id', retrieveDocumentHandler(commitsCol))
  app.get('/api/repositories', searchRequestHandler(repoCol, '_id'))
  app.get('/api/repositories/:id', retrieveDocumentHandler(repoCol))

  app.get('/api/jobs', searchRequestHandler(jobCol, '_id'))
  app.post('/api/jobs', scheduleJob)
  app.get('/api/jobs/:id', retrieveDocumentHandler(jobCol))
  app.post('/api/jobs/:id/retry', retryJob)
}
