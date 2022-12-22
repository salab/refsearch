import {repoDirName} from "../info";
import simpleGit from "simple-git";
import {CommitMeta, RefactoringType, RepositoryMeta} from "../../../common/common";
import {commitsCol, refCol, repoCol} from "../mongo";
import {commitUrl, formatTime} from "../utils";

const storeRepoMetadata = async (repoUrl: string): Promise<void> => {
  console.log(`Processing metadata for repository ${repoUrl}...`)
  const start = performance.now()

  const repoMeta: RepositoryMeta = {
    _id: repoUrl,
    url: repoUrl
  }

  const res = await repoCol.replaceOne({ _id: repoUrl }, repoMeta, { upsert: true })
  if (!res.acknowledged) {
    throw new Error(`Failed to write repository meta for ${repoUrl}`)
  }
  console.log(`Updated repository meta in ${formatTime(start)}.`)
}

const storeCommitMetadata = async (repoUrl: string): Promise<void> => {
  console.log(`Processing commit metadata for repository ${repoUrl}...`)
  const start = performance.now()

  const repoPath = repoDirName(repoUrl)
  const git = simpleGit(repoPath)
  const gitLog = await git.log()

  const refactorings = await (async () => {
    const cursor = refCol.find({ repository: repoUrl }, { projection: { sha1: 1, type: 1 } })
    const res: { sha1: string; type: typeof RefactoringType[keyof typeof RefactoringType] }[] = []
    await cursor.forEach((r) => {
      res.push(r)
    })
    return res
  })()
  const refactoringCount = refactorings.reduce((acc, r) => {
    acc[r.sha1] ??= {}
    acc[r.sha1][r.type] ??= 0
    acc[r.sha1][r.type]++
    return acc
  }, {} as Record<string, Record<string, number>>)

  const commits = gitLog.all.map((e): CommitMeta => ({
    ...e,
    _id: e.hash,
    date: new Date(e.date),
    url: commitUrl(repoUrl, e.hash),
    repository: repoUrl,
    refactorings: refactoringCount[e.hash] ?? {},
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
  console.log(`Processed ${commits.length} metadata (${res.insertedCount} inserted, ${res.modifiedCount} modified) in ${formatTime(start)}.`)
}

export const storeMetadata = async (repoUrl: string): Promise<void> => {
  await storeRepoMetadata(repoUrl)
  await storeCommitMetadata(repoUrl)
}
