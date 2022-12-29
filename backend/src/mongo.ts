import {MongoClient} from "mongodb";
import {CommitMeta, RefactoringMeta, RepositoryMeta} from "../../common/common";
import {Job} from "../../common/jobs";

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
