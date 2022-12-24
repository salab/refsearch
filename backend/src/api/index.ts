import {Express} from "express";
import {retrieveDocumentHandler, searchRequestHandler} from "./common";
import {commitsCol, refCol, repoCol} from "../mongo";

export const registerRoutes = (app: Express): void => {
  app.get('/api/refactorings', searchRequestHandler(refCol, 'commit.date'))
  app.get('/api/refactorings/:id', retrieveDocumentHandler(refCol))
  app.get('/api/commits', searchRequestHandler(commitsCol, 'date'))
  app.get('/api/commits/:cid', retrieveDocumentHandler(commitsCol))
  app.get('/api/repositories', searchRequestHandler(repoCol, '_id'))
  app.get('/api/repositories/:id', retrieveDocumentHandler(repoCol))
}
