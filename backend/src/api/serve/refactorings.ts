import { Request, Response } from 'express'
import { commitPlaceholder, RefactoringMeta, RefactoringType } from '../../../../common/common.js'
import { commitUrl } from '../../utils.js'
import { commitsCol, refCol, repoCol } from '../../mongo.js'
import { mergeCommitMetadataIntoRefactorings, updateCommitRefactoringMetadata } from '../../jobs/metadata.js'

interface PostRequest extends Request {
  body: {
    repository: string
    commit: string

    refactorings: {
      type: string
      description: string

      meta: {
        tool?: string
      }
    }[]
  }
}

export const postRefactoringsHandler = async (req: PostRequest, res: Response) => {
  const body = req.body

  const refactorings = body.refactorings.map((r): RefactoringMeta => {
    return {
      ...r,
      type: r.type as RefactoringType, // ignore type-check

      sha1: body.commit,
      repository: body.repository,
      url: commitUrl(body.repository, body.commit),

      commit: commitPlaceholder(),
    }
  })

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
  const insertRes = await refCol.insertMany(refactorings)
  if (!insertRes.acknowledged) {
    return res.status(500).json({
      message: 'Internal error',
    })
  }

  // Update metadata
  await updateCommitRefactoringMetadata(body.commit)
  await mergeCommitMetadataIntoRefactorings(body.commit)

  return res.status(200).json({
    message: `Inserted ${insertRes.insertedCount} document(s)`,
  })
}
