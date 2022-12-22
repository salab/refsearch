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

const localDB = client.db('local')

export const repoCol = localDB.collection<RepositoryMeta>('repositories')
export const commitsCol = localDB.collection<CommitMeta>('commits')
export const refCol = localDB.collection<RefactoringMeta>('refactorings')

export const refWithCommitCol = localDB.collection<Omit<Refactoring, '_id'>>('ref_with_commit')

const createView = async () => {
  const collections = await localDB.collections()
  if (collections.find((c) => c.collectionName === 'ref_with_commit')) return
  await localDB.createCollection<Refactoring>('ref_with_commit', {
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
      { $unwind: '$commit' }
    ],
  })
}
createView()
