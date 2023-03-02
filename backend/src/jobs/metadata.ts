import { repoDirName } from './info.js'
import simpleGit, { DefaultLogFields, ListLogLine } from 'simple-git'
import {
  CommitMeta,
  CommitProcessState,
  CommitSizeInfo,
  RefactoringMeta,
  RefactoringsCount,
  RefactoringType,
  RepositoryMeta,
} from '../../../common/common.js'
import { commitsCol, refCol, repoCol } from '../mongo.js'
import { commitUrl, readAllFromCursor } from '../utils.js'
import { JobWithId } from '../jobs.js'
import { Filter } from 'mongodb'
import { JobData } from '../../../common/jobs.js'

type RefTypeMeta = Pick<RefactoringMeta, 'sha1' | 'type' | 'meta'>
const refactoringCount = async (filter: Filter<RefactoringMeta>): Promise<RefactoringsCount> => {
  const typeMetas = await readAllFromCursor(
    refCol.find(filter, { projection: { sha1: 1, type: 1, meta: 1 } }),
  ) as RefTypeMeta[]
  const countPerType = typeMetas.reduce((acc, r) => {
    acc[r.type] ??= 0
    acc[r.type]++
    return acc
  }, {} as Record<RefactoringType, number>)
  const countPerTool = typeMetas.reduce((acc, r) => {
    if (r.meta.tool) {
      acc[r.meta.tool] ??= 0
      acc[r.meta.tool]++
    }
    return acc
  }, {} as Record<string, number>)
  return {
    total: typeMetas.length,
    perType: countPerType,
    perTool: countPerTool,
  }
}

const getCommitSizeInfo = (e: DefaultLogFields & ListLogLine): CommitSizeInfo => {
  return {
    files: {
      changed: e.diff?.changed ?? 0,
    },
    lines: {
      inserted: e.diff?.insertions ?? 0,
      deleted: e.diff?.deletions ?? 0,
    },
  }
}

export const updateRepositoryMetadata = async (job: JobWithId, jobData: JobData): Promise<void> => {
  const commits = await commitsCol.countDocuments({ repository: jobData.repoUrl })
  const refactorings = await refactoringCount({ repository: jobData.repoUrl })

  const repoMeta: RepositoryMeta = {
    _id: jobData.repoUrl,
    commits: commits,
    refactorings: refactorings,
  }

  const res = await repoCol.replaceOne({ _id: jobData.repoUrl }, repoMeta, { upsert: true })
  if (!res.acknowledged) {
    throw new Error(`Failed to write repository meta for ${jobData.repoUrl}`)
  }
}

export const storeCommitsMetadata = async (job: JobWithId, jobData: JobData): Promise<void> => {
  const repoPath = repoDirName(jobData.repoUrl)

  const git = simpleGit(repoPath)
  const gitLogOption = ['--stat', '--min-parents=1', '--max-parents=1']
  switch (jobData.commits.type) {
    case 'all': // no additional option
      break
    case 'range':
      gitLogOption.push(jobData.commits.from)
      if (jobData.commits.to) {
        gitLogOption.push('^'+jobData.commits.to)
      }
      break
    case 'one':
      gitLogOption.push(jobData.commits.sha1, '^'+jobData.commits.sha1+'~')
      break
  }
  const gitLog = await git.log(gitLogOption)

  const existingCommits = await readAllFromCursor(
    await commitsCol.find({ repository: jobData.repoUrl }, { projection: { _id: 1 } }),
  ).then((res) => res.map((doc) => doc._id))
  const existingCommitsSet = new Set(existingCommits)

  const commits = gitLog.all
    .filter((e) => !existingCommitsSet.has(e.hash))
    .map((e): CommitMeta => ({
      _id: e.hash,

      date: new Date(e.date),
      message: e.message,
      refs: e.refs,
      body: e.body,
      authorName: e.author_name,
      authorEmail: e.author_email,
      url: commitUrl(jobData.repoUrl, e.hash),
      repository: jobData.repoUrl,

      size: getCommitSizeInfo(e),
      refactorings: {
        total: 0,
        perType: {},
        perTool: {},
      },
      tools: {},
    }))

  if (commits.length > 0) {
    const res = await commitsCol.insertMany(commits, { ordered: false })
    if (!res.acknowledged) {
      throw new Error(`Failed to bulk update commits meta for ${jobData.repoUrl}`)
    }
    console.log(`[metadata.ts] Found ${gitLog.all.length} commits, inserted ${res.insertedCount} new commit(s).`)
  } else {
    console.log(`[metadata.ts] Found ${gitLog.all.length} commits, no new commits inserted.`)
  }
}

export const updateCommitMetadata = async (commit: string, tools: Record<string, CommitProcessState>): Promise<void> => {
  const refactorings = await refactoringCount({ sha1: commit })
  await commitsCol.updateOne({ _id: commit }, { $set: { refactorings: refactorings, tools: tools } })
}

export const mergeCommitMetadata = async (commit: string): Promise<void> => {
  const cursor = refCol.aggregate([
    { $match: { sha1: commit } },
    { $lookup: { from: 'commits', localField: 'sha1', foreignField: '_id', as: 'commit' } },
    { $unwind: '$commit' },
    { $project: { commit: { _id: 0, hash: 0, repository: 0 } } },
    { $merge: { into: 'refactorings', on: '_id', whenMatched: 'replace', whenNotMatched: 'fail' } },
  ])
  await cursor.forEach(() => {
  })
}
