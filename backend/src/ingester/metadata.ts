import {repoDirName} from "./info";
import simpleGit, {DefaultLogFields, ListLogLine} from "simple-git";
import {
  CommitMeta,
  CommitSizeInfo,
  RefactoringMeta,
  RefactoringsCount,
  RefactoringType,
  RepositoryMeta
} from "../../../common/common";
import {commitsCol, refCol, repoCol} from "../mongo";
import {commitUrl, readAllFromCursor} from "../utils";
import {JobWithId} from "../jobs";
import {Filter} from "mongodb";

type RefTypeMeta = Pick<RefactoringMeta, 'sha1' | 'type' | 'meta'>
const refactoringCount = async (filter: Filter<RefactoringMeta>): Promise<RefactoringsCount> => {
  const typeMetas = await readAllFromCursor(
    refCol.find(filter, { projection: { sha1: 1, type: 1, meta: 1 } })
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
      deleted: e.diff?.deletions ?? 0
    }
  }
}

export const updateRepositoryMetadata = async ({ data }: JobWithId): Promise<void> => {
  const commits = await commitsCol.countDocuments({ repository: data.repoUrl })
  const refactorings = await refactoringCount({ repository: data.repoUrl })

  const repoMeta: RepositoryMeta = {
    _id: data.repoUrl,
    commits: commits,
    refactorings: refactorings,
  }

  const res = await repoCol.replaceOne({ _id: data.repoUrl }, repoMeta, { upsert: true })
  if (!res.acknowledged) {
    throw new Error(`Failed to write repository meta for ${data.repoUrl}`)
  }
}

export const storeCommitsMetadata = async ({ data }: JobWithId): Promise<void> => {
  const repoPath = repoDirName(data.repoUrl)

  const git = simpleGit(repoPath)
  const gitLog = await git.log(['--stat', '--no-merges'])

  const existingCommits = await readAllFromCursor(
    await commitsCol.find({ repository: data.repoUrl }, { projection: { _id: 1 } })
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
      url: commitUrl(data.repoUrl, e.hash),
      repository: data.repoUrl,

      size: getCommitSizeInfo(e),
      refactorings: {
        total: 0,
        perType: {},
        perTool: {},
      },
      tools: [],
    }))

  const res = await commitsCol.insertMany(commits, { ordered: false })
  if (!res.acknowledged) {
    throw new Error(`Failed to bulk update commits meta for ${data.repoUrl}`)
  }

  console.log(`[metadata.ts] Found ${gitLog.all.length} commits, inserted ${res.insertedCount} new commit(s).`)
}

export const updateCommitMetadata = async (commit: string, tools: string[]): Promise<void> => {
  const refactorings = await refactoringCount({ sha1: commit })
  await commitsCol.updateOne({ _id: commit }, { $set: { refactorings: refactorings, tools: tools } })
}

export const mergeCommitMetadata = async (commit: string): Promise<void> => {
  const cursor = refCol.aggregate([
    { $match: { sha1: commit } },
    { $lookup: { from: 'commits', localField: 'sha1', foreignField: '_id', as: 'commit'} },
    { $unwind: '$commit' },
    { $project: { commit: { _id: 0, hash: 0, repository: 0 } } },
    { $merge: { into: 'refactorings', on: '_id', whenMatched: 'replace', whenNotMatched: 'fail' } },
  ])
  await cursor.forEach(() => {})
}
