import {repoDirName} from "../info";
import simpleGit from "simple-git";
import {CommitMeta, RefactoringType, RepositoryMeta} from "../../../common/common";
import {commitsCol, refCol, repoCol} from "../mongo";
import {commitUrl} from "../utils";
import {formatTime} from "../../../common/utils";

interface RefTypeMeta { sha1: string; type: RefactoringType }
const getRefactoringTypeMetas = async (repoUrl: string): Promise<RefTypeMeta[]> => {
  const start = performance.now()

  const cursor = refCol.find({ repository: repoUrl }, { projection: { sha1: 1, type: 1 } })
  const res: RefTypeMeta[] = []
  await cursor.forEach((r) => {
    res.push(r)
  })

  console.log(`[metadata > type metas] Retrieved in ${formatTime(start)}.`)
  return res
}

const storeRepoMetadata = async (repoUrl: string, typeMetas: RefTypeMeta[]): Promise<void> => {
  const start = performance.now()

  const countPerType = typeMetas.reduce((acc, r) => {
    acc[r.type] ??= 0
    acc[r.type]++
    return acc
  }, {} as Record<RefactoringType, number>)
  const repoMeta: RepositoryMeta = {
    _id: repoUrl,
    refactorings: countPerType,
  }

  const res = await repoCol.replaceOne({ _id: repoUrl }, repoMeta, { upsert: true })
  if (!res.acknowledged) {
    throw new Error(`Failed to write repository meta for ${repoUrl}`)
  }
  console.log(`[metadata > repo meta] Updated in ${formatTime(start)}.`)
}

const storeCommitMetadata = async (repoUrl: string, typeMetas: RefTypeMeta[]): Promise<void> => {
  const start = performance.now()

  const repoPath = repoDirName(repoUrl)
  const git = simpleGit(repoPath)
  const gitLog = await git.log()

  const countPerType = typeMetas.reduce((acc, r) => {
    acc[r.sha1] ??= {} as Record<RefactoringType, number>
    acc[r.sha1][r.type] ??= 0
    acc[r.sha1][r.type]++
    return acc
  }, {} as Record<string, Record<RefactoringType, number>>)

  const commits = gitLog.all.map((e): CommitMeta => ({
    _id: e.hash,
    date: new Date(e.date),
    message: e.message,
    refs: e.refs,
    body: e.body,
    authorName: e.author_name,
    authorEmail: e.author_email,
    url: commitUrl(repoUrl, e.hash),
    repository: repoUrl,
    refactorings: countPerType[e.hash] ?? {},
  }))

  const res = await commitsCol.bulkWrite(commits.map((c) => ({
    replaceOne: {
      filter: { _id: c._id },
      replacement: c,
      upsert: true
    }
  })))
  if (!res.isOk()) {
    throw new Error(`Failed to bulk update commits meta for ${repoUrl}`)
  }
  console.log(`[metadata > commit metas] Updated ${commits.length} commit metadata in ${formatTime(start)}.`)
}

const mergeCommitMetadata = async (repoUrl: string): Promise<void> => {
  const start = performance.now()

  const cursor = refCol.aggregate([
    { $match: { repository: repoUrl } },
    { $lookup: { from: 'commits', localField: 'sha1', foreignField: '_id', as: 'commit'} },
    { $unwind: '$commit' },
    { $project: { commit: { _id: 0, hash: 0, repository: 0 } } },
    { $merge: { into: 'refactorings', on: '_id', whenMatched: 'replace', whenNotMatched: 'fail' } },
  ])
  await cursor.forEach(() => {})

  console.log(`[metadata > merger] Merged commit metadata for refactoring documents in ${formatTime(start)}.`)
}

export const storeMetadata = async (repoUrl: string): Promise<void> => {
  const typeMetas = await getRefactoringTypeMetas(repoUrl)
  await storeRepoMetadata(repoUrl, typeMetas)
  await storeCommitMetadata(repoUrl, typeMetas)
  await mergeCommitMetadata(repoUrl)
}
