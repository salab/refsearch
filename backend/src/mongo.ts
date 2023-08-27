import {
  Collection,
  CreateCollectionOptions,
  CreateIndexesOptions,
  Document,
  IndexSpecification,
  MongoClient,
} from 'mongodb'
import { CommitMeta, RefactoringMeta, RepositoryMeta } from '../../common/common.js'
import { Job, JobData, JobWithData } from '../../common/jobs.js'
import { formatTime } from '../../common/utils.js'
import { readAllFromCursor } from './utils.js'
import { ToolRawData } from './types.js'
import { config } from './config.js'

const env = config.db
const uri = `mongodb://${env.user}:${env.password}@${env.host}:${env.port}?retryWrites=true&w=majority`
const client = new MongoClient(uri)

const db = client.db('refsearch')

type CollectionName =
  'repositories' |
  'commits' |
  'refactorings' |
  'jobs' |
  'job_data' |
  'job_with_data' |
  'tool_raw_data'

export const repoCol = db.collection<RepositoryMeta>('repositories' satisfies CollectionName)
export const commitsCol = db.collection<CommitMeta>('commits' satisfies CollectionName)
export const refCol = db.collection<RefactoringMeta>('refactorings' satisfies CollectionName)
export const jobCol = db.collection<Job>('jobs' satisfies CollectionName)
export const jobDataCol = db.collection<JobData>('job_data' satisfies CollectionName)
export const jobWithData = db.collection<JobWithData>('job_with_data' satisfies CollectionName)
export const toolRawDataCol = db.collection<ToolRawData>('tool_raw_data' satisfies CollectionName)

const collections: [collection: Collection<any>, options: CreateCollectionOptions][] = [
  [repoCol, {}],
  [commitsCol, {}],
  [refCol, {}],
  [jobCol, {}],
  [jobDataCol, {}],
  [jobWithData, {
    viewOn: 'jobs' satisfies CollectionName,
    pipeline: [
      { $lookup: { from: 'job_data' satisfies CollectionName, localField: 'pipeline', foreignField: '_id', as: 'data' } },
      { $unwind: '$data' },
    ],
  }],
  [toolRawDataCol, {}],
]

const createCollections = async () => {
  const existing = await readAllFromCursor(db.listCollections())
  for (const [c, options] of collections) {
    if (existing.find((col) => col.name === c.collectionName)) continue

    const start = performance.now()
    await db.createCollection(c.collectionName, options)
    console.log(`[mongo.ts] Created collection ${c.collectionName} in ${formatTime(start)}`)
  }
  console.log(`[mongo.ts] Finished syncing collections`)
}

interface Index {
  name: string;
  key: IndexSpecification
}

type IndexDef = [spec: IndexSpecification, opt: CreateIndexesOptions]

const createIndexes = async <T extends Document>(col: Collection<T>, defs: IndexDef[]) => {
  const indexes = await readAllFromCursor(col.listIndexes()) as Index[]

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

const createMissingIndexes = async () => {
  await createIndexes(commitsCol, [
    [[['repository', 1], ['date', 1]], { name: 'idx_repository_date' }],
    [[['date', 1]], { name: 'idx_date' }],
  ])
  await createIndexes(refCol, [
    [[['type', 1]], { name: 'idx_type' }],
    [[['sha1', 1]], { name: 'idx_sha1' }],
    [[['commit.sha1', 1]], { name: 'idx_commit_sha1' }],
    [[['commit.date', 1]], { name: 'idx_commit_date' }],
  ])
  await createIndexes(toolRawDataCol, [
    [[['commit', 1], ['tool', 1]], { name: 'idx_commit_tool', unique: true }],
  ])
  console.log(`[mongo.ts] Finished syncing indexes`)
}

export const syncDB = async () => {
  await createCollections()
  await createMissingIndexes()
}
