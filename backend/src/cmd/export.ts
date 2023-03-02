import { commitsCol, toolRawDataCol } from '../mongo.js'
import { readAllFromCursor } from '../utils.js'
import { ExportFormat } from '../types.js'
import fs from 'fs'

const main = async () => {
  if (process.argv.length < 5) {
    console.log(`Usage: export.js repo-url tool-name path/to/data.json`)
    process.exit(1)
  }

  const repoUrl = process.argv[2]
  const toolName = process.argv[3]
  const filename = process.argv[4]

  const commits = await readAllFromCursor(commitsCol.find(
    { repository: repoUrl },
    { sort: ['date', 1], projection: { _id: 1 } },
  ))
  console.log(`Reading ${commits.length} commits for repository ${repoUrl}...`)

  const exportFormat: ExportFormat = []
  for (const commit of commits) {
    const toolData = await toolRawDataCol.findOne({ commit: commit._id, tool: toolName })
    if (!toolData) continue
    exportFormat.push({ sha1: commit._id, refactorings: toolData.data })
  }
  console.log(`Read ${exportFormat.length} commits from cache, exporting`)

  fs.writeFileSync(filename, JSON.stringify(exportFormat))

  process.exit(0)
}

main()
