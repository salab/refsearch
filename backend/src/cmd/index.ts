import express from 'express'
import { registerRoutes } from '../api/serve/routes.js'
import { syncDB } from '../mongo.js'
import { config } from '../config.js'

const main = async () => {
  await syncDB()

  const app = express()
  app.use(express.json())
  registerRoutes(app)

  app.listen(config.port, () => console.log(`API server started on port ${config.port}`))
}

main()
