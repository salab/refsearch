import { toolRawDataCol } from '../mongo.js'
import { ExportFormat, ToolRawData } from '../types.js'
import fs from 'fs'

const main = async () => {
  if (process.argv.length < 3) {
    console.log(`Usage: node load.js path/to/data.json`)
    process.exit(1)
  }

  const filename = process.argv[2]

  const data = JSON.parse(fs.readFileSync(filename).toString()) as ExportFormat
  if (!Array.isArray(data)) {
    throw new Error('invalid data format')
  }
  console.log(`Read ${data.length} raw data from file ${filename}...`)

  const toolData = data.map((d): ToolRawData => ({ commit: d.sha1, tool: d.tool, data: d.refactorings }))
  const res = await toolRawDataCol.bulkWrite(toolData.map((d) => ({
    replaceOne: {
      filter: { commit: d.commit, tool: d.tool },
      replacement: d,
      upsert: true,
    }
  })))
  if (!res.isOk()) {
    throw new Error('failed to insert data')
  }

  console.log(`Inserted ${res.insertedCount}, modified ${res.modifiedCount} documents.`)
}

main()
  .then(() => process.exit(0))
