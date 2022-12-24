import express from "express";
import {registerRoutes} from "./api";

const app = express()
registerRoutes(app)

const port: number = Number.parseInt(process.env.PORT ?? '') || 3000
app.listen(port, () => console.log(`API server started on port ${port}`))
