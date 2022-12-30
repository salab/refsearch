import express from "express";
import {registerRoutes} from "../api";
import {createMissingIndexes} from "../mongo";

const main = async () => {
  await createMissingIndexes()

  const app = express()
  app.use(express.json())
  registerRoutes(app)

  const port: number = Number.parseInt(process.env.PORT ?? '') || 3000
  app.listen(port, () => console.log(`API server started on port ${port}`))
}

main()
