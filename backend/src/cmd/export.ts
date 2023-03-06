import { commitsCol, toolRawDataCol } from '../mongo.js'
import { readAllFromCursor } from '../utils.js'
import { ExportFormat } from '../types.js'
import fs from 'fs'

const main = async () => {
  if (process.argv.length < 3) {
    console.log(`Usage: node export.js path/to/data.json [repo-url]`)
    process.exit(1)
  }

  const filename = process.argv[2]
  const repoUrl = process.argv[3] || undefined

  const commits = await readAllFromCursor(commitsCol.find(
    repoUrl ? { repository: repoUrl } : {},
    { sort: ['date', 1], projection: { _id: 1 } },
  ))
  console.log(`Reading ${commits.length} commits for ${repoUrl ? `repository ${repoUrl}` : 'all repositories'}...`)

  const exportFormat: ExportFormat = []
  for (const commit of commits) {
    const toolData = await toolRawDataCol.findOne({ commit: commit._id })
    if (!toolData) continue
    exportFormat.push({ sha1: commit._id, tool: toolData.tool, refactorings: toolData.data })
  }
  console.log(`Read ${exportFormat.length} entries from cache, exporting`)

  fs.writeFileSync(filename, JSON.stringify(exportFormat))

  process.exit(0)
}

main()
