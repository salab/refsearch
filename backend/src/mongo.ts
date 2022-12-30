import {Collection, CreateIndexesOptions, Document, IndexSpecification, MongoClient} from "mongodb";
import {CommitMeta, RefactoringMeta, RepositoryMeta} from "../../common/common";
import {Job} from "../../common/jobs";
import {formatTime} from "../../common/utils";

const env = {
  user: process.env.MONGODB_USER || 'root',
  password: process.env.MONGODB_PASSWORD || 'password',
  host: process.env.MONGODB_HOST || 'localhost',
  port: process.env.MONGODB_PORT || '27017'
}

const uri = `mongodb://${env.user}:${env.password}@${env.host}:${env.port}?retryWrites=true&w=majority`
const client = new MongoClient(uri)

const db = client.db('refsearch')

export const repoCol = db.collection<RepositoryMeta>('repositories')
export const commitsCol = db.collection<CommitMeta>('commits')
export const refCol = db.collection<RefactoringMeta>('refactorings')

export const jobCol = db.collection<Job>('jobs')

interface Index { name: string; key: IndexSpecification }
type IndexDef = [spec: IndexSpecification, opt: CreateIndexesOptions]
const createIndexes = async <T extends Document>(col: Collection<T>, defs: IndexDef[]) => {
  const indexesCursor = col.listIndexes()
  const indexes: Index[] = []
  await indexesCursor.forEach((idx) => void indexes.push(idx as Index))

  // Drop indexes
  for (const { name } of indexes) {
    if (name === '_id_') continue
    if (defs.find(([_, opt]) => name === opt.name)) continue
    const start = performance.now()
    await col.dropIndex(name)
    console.log(`[mongo.ts] Dropped index ${name} on ${col.collectionName} in ${formatTime(start)}`)
  }
  // Add indexes
  for (const [spec, opt] of defs) {
    if (indexes.find((idx) => idx.name === opt.name)) continue
    const start = performance.now()
    await col.createIndex(spec, opt)
    console.log(`[mongo.ts] Added index ${opt.name} to ${col.collectionName} in ${formatTime(start)}`)
  }
}
export const createMissingIndexes = async () => {
  await createIndexes(commitsCol, [
    [[['repository', 1]], { name: 'idx_repository' }],
    [[['date', 1]], { name: 'idx_date' }],
  ])
  await createIndexes(refCol, [
    [[['type', 1]], { name: 'idx_type' }],
    [[['sha1', 1]], { name: 'idx_sha1' }],
    [[['commit.date', 1]], { name: 'idx_commit_date' }],
  ])
  console.log(`[mongo.ts] Finished syncing indexes`)
}
