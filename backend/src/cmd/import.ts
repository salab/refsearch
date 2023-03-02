import { toolRawDataCol } from '../mongo.js'
import { ExportFormat, ToolRawData } from '../types.js'
import fs from 'fs'

const main = async () => {
  if (process.argv.length < 5) {
    console.log(`Usage: load.js repo-url tool-name path/to/data.json`)
    process.exit(1)
  }

  // const repoUrl = process.argv[2]
  const toolName = process.argv[3]
  const filename = process.argv[4]

  const data = JSON.parse(fs.readFileSync(filename).toString()) as ExportFormat
  if (!Array.isArray(data)) {
    console.log(`invalid data format`)
    process.exit(1)
  }
  console.log(`Read ${data.length} raw data from file ${filename}...`)

  const toolData = data.map((d): ToolRawData => ({ commit: d.sha1, tool: toolName, data: d.refactorings }))
  const res = await toolRawDataCol.bulkWrite(toolData.map((d) => ({
    replaceOne: {
      filter: { commit: d.commit, tool: d.tool },
      replacement: d,
      upsert: true,
    }
  })))
  if (!res.isOk()) {
    console.log(`failed to insert data`)
    process.exit(1)
  }

  console.log(`Inserted ${res.insertedCount}, modified ${res.modifiedCount} documents.`)
  process.exit(0)
}

main()
