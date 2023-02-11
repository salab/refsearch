import express from "express";
import {registerRoutes} from "../api/serve";
import {createCollections, createMissingIndexes} from "../mongo";
import {config} from "../config";

const main = async () => {
  await createCollections()
  await createMissingIndexes()

  const app = express()
  app.use(express.json())
  registerRoutes(app)

  app.listen(config.port, () => console.log(`API server started on port ${config.port}`))
}

main()
