import {MongoClient} from "mongodb";
import {CommitMeta, Refactoring, RepositoryMeta} from "../../types/types";

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
export const refCol = localDB.collection<Refactoring>('refactorings')
