import {MongoClient} from "mongodb";
import {CommitMeta, Refactoring, RefactoringMeta, RepositoryMeta} from "../../common/common";

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

export const refWithCommitCol = db.collection<Omit<Refactoring, '_id'>>('ref_with_commit')

const createView = async () => {
  const collections = await db.collections()
  const exists = (name: string) => collections.find((c) => c.collectionName === name)
  if (!exists('ref_with_commit')) {
    await db.createCollection('ref_with_commit', {
      viewOn: 'refactorings',
      pipeline: [
        {
          $lookup: {
            from: 'commits',
            localField: 'sha1',
            foreignField: '_id',
            as: 'commit'
          }
        },
        {
          $project: {
            'commit._id': 0,
            'sha1': 0,
          }
        },
        { $unwind: '$commit' },
      ]
    })
  }
}
createView()
