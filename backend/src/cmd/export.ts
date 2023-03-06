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

  const toolRawData = await readAllFromCursor(toolRawDataCol.find({
    commit: { $in: commits.map((c) => c._id) }
  }))
  const exportFormat: ExportFormat = toolRawData.map((d) => ({ sha1: d.commit, tool: d.tool, refactorings: d.data }))
  console.log(`Read ${exportFormat.length} entries from cache, exporting`)

  const encodedFile = JSON.stringify(exportFormat)
  console.log(`Writing ${encodedFile.length} bytes to file ${filename}`)
  fs.writeFileSync(filename, encodedFile)
  console.log('Export complete.')
}

main()
  .then(() => process.exit(0))
