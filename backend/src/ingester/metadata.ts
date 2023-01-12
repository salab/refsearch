import {repoDirName} from "./info";
import simpleGit, {DefaultLogFields, ListLogLine} from "simple-git";
import {CommitMeta, CommitSizeInfo, RefactoringMeta, RefactoringType, RepositoryMeta} from "../../../common/common";
import {commitsCol, refCol, repoCol} from "../mongo";
import {commitUrl, readAllFromCursor} from "../utils";
import {formatTime} from "../../../common/utils";
import {JobWithId} from "../jobs";

type RefTypeMeta = Pick<RefactoringMeta, 'sha1' | 'type' | 'meta'>
const getRefactoringTypeMetas = async (repoUrl: string): Promise<RefTypeMeta[]> => {
  const start = performance.now()

  const res = await readAllFromCursor(
    refCol.find({ repository: repoUrl }, { projection: { sha1: 1, type: 1, meta: 1 } })
  )

  console.log(`[metadata > type metas] Retrieved in ${formatTime(start)}.`)
  return res
}

const getCommitSizeInfo = (e: DefaultLogFields & ListLogLine): CommitSizeInfo => {
  return {
    files: {
      changed: e.diff?.changed ?? 0,
    },
    lines: {
      inserted: e.diff?.insertions ?? 0,
      deleted: e.diff?.deletions ?? 0
    }
  }
}

const total = (m: Record<string, number>): number => Object.values(m).reduce((a, r) => a + r, 0)

const storeRepoMetadata = async (repoUrl: string, startCommit: string, typeMetas: RefTypeMeta[]): Promise<void> => {
  const start = performance.now()

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
  const repoMeta: RepositoryMeta = {
    _id: repoUrl,
    refactorings: {
      total: typeMetas.length,
      perType: countPerType,
      perTool: countPerTool,
    },
    indexedUntil: startCommit,
  }

  const res = await repoCol.replaceOne({ _id: repoUrl }, repoMeta, { upsert: true })
  if (!res.acknowledged) {
    throw new Error(`Failed to write repository meta for ${repoUrl}`)
  }
  console.log(`[metadata > repo meta] Updated in ${formatTime(start)}.`)
}

const storeCommitMetadata = async (repoUrl: string, startCommit: string, endCommit: string, typeMetas: RefTypeMeta[]): Promise<void> => {
  const start = performance.now()

  const repoPath = repoDirName(repoUrl)
  const git = simpleGit(repoPath)
  const gitLog = await git.log(['--stat', `${endCommit}..${startCommit}`])

  const countPerType = typeMetas.reduce((acc, r) => {
    acc[r.sha1] ??= {} as Record<RefactoringType, number>
    acc[r.sha1][r.type] ??= 0
    acc[r.sha1][r.type]++
    return acc
  }, {} as Record<string, Record<RefactoringType, number>>)
  const countPerTool = typeMetas.reduce((acc, r) => {
    acc[r.sha1] ??= {}
    if (r.meta.tool) {
      acc[r.sha1][r.meta.tool] ??= 0
      acc[r.sha1][r.meta.tool]++
    }
    return acc
  }, {} as Record<string, Record<string, number>>)

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
    size: getCommitSizeInfo(e),
    refactorings: {
      total: total(countPerType[e.hash] ?? {}),
      perType: countPerType[e.hash] ?? {},
      perTool: countPerTool[e.hash] ?? {},
    },
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

export const storeMetadata = async ({ data }: JobWithId): Promise<void> => {
  if (!data.startCommit || !data.endCommit) {
    throw new Error('start/end commit not found')
  }
  const typeMetas = await getRefactoringTypeMetas(data.repoUrl)
  await storeRepoMetadata(data.repoUrl, data.startCommit, typeMetas)
  await storeCommitMetadata(data.repoUrl, data.startCommit, data.endCommit, typeMetas)
  await mergeCommitMetadata(data.repoUrl)
}
