import { Request, Response } from 'express'
import { PureRefactoringMeta } from '../../../../common/common.js'
import { commitsCol, repoCol } from '../../mongo.js'
import { transformAndInsertRefactorings } from '../../jobs/process.js'

interface PostRequest extends Request {
  body: {
    repository: string
    commit: string

    refactorings: PureRefactoringMeta[]
  }
}

export const postRefactoringsHandler = async (req: PostRequest, res: Response) => {
  const body = req.body

  {
    // Check repository and commits existence
    const actualCommit = await commitsCol.findOne({ _id: body.commit })
    const actualRepository = await repoCol.findOne({ _id: body.repository })

    if (!actualCommit) {
      return res.status(400).json({
        message: 'Commit metadata not found, post commit metadata first',
      })
    }
    if (!actualRepository) {
      return res.status(400).json({
        message: 'Repository metadata not found, post repository metadata first',
      })
    }
  }

  // Insert
  const insertRes = await transformAndInsertRefactorings(body.repository, body.commit, body.refactorings)

  return res.status(200).json({
    message: `Inserted ${insertRes.insertedCount} document(s)`,
  })
}
