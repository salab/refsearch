import { commitsCol, refCol, repoCol,  } from '../../mongo.js'
import { ObjectId } from 'mongodb'

export const deleteRepositoryHandler = async (id: string): Promise<void> => {
  const repoRes = await repoCol.deleteOne({ _id: id })
  if (!repoRes.acknowledged || repoRes.deletedCount === 0) {
    throw new Error('deleting repository')
  }
  const commitRes = await commitsCol.deleteMany({ repository: id })
  if (!commitRes.acknowledged) {
    throw new Error('deleting commits')
  }
  const refRes = await refCol.deleteMany({ repository: id })
  if (!refRes.acknowledged) {
    throw new Error('deleting commits')
  }
}

export const deleteCommitHandler = async (id: string): Promise<void> => {
  const commitRes = await commitsCol.deleteOne({ _id: id })
  if (!commitRes.acknowledged || commitRes.deletedCount === 0) {
    throw new Error('deleting commit')
  }
  const refRes = await refCol.deleteMany({ sha1: id })
  if (!refRes.acknowledged) {
    throw new Error('deleting refactorings')
  }
}

export const deleteRefactoringHandler = async (id: string): Promise<void> => {
  const refRes = await refCol.deleteOne({ _id: new ObjectId(id) })
  if (!refRes.acknowledged || refRes.deletedCount === 0) {
    throw new Error('deleting refactoring')
  }
}
