import fs from "fs";
import {commitsCol, refCol, repoCol} from "./mongo";
import {RMOutput} from "../../common/rminer";
import {CommitMeta, RepositoryMeta} from "../../common/common";
import simpleGit from "simple-git";
import {RefDiffOutput} from "../../common/refdiff";
import {processRMinerOutput} from "./converter/rminer";
import {processRefDiffOutput} from "./converter/refdiff";
import {refDiffFileName, repoDirName, repositoriesDir, rminerFileName} from "./info";

const formatTime = (start: number): string => `${Math.floor(performance.now() - start) / 1000} s`

const cloneRepo = async (repoUrl: string): Promise<void> => {
  const dirName = repoDirName(repoUrl)

  if (fs.existsSync(dirName)) {
    const git = simpleGit(dirName)
    const existingRemote = await git.remote(['get-url', 'origin'])
    if (!existingRemote) {
      throw new Error(`Failed to exec git remote get-url origin in ${dirName}`)
    }

    if (repoUrl === existingRemote.trim()) {
      console.log(`${repoUrl} is already cloned at ${dirName}, fetching remote...`)
      const start = performance.now()
      await git.fetch()
      console.log(`Fetch complete in ${formatTime(start)}.`)
      return
    } else {
      console.log(`Found another repo at path ${dirName} (${existingRemote}), will delete the current one.`)
      fs.rmSync(dirName, { recursive: true })
      // fallthrough
    }
  }

  console.log(`Cloning ${repoUrl} into ${dirName}...`)
  const start = performance.now()
  await simpleGit(repositoriesDir).clone(repoUrl)
  console.log(`Clone complete in ${formatTime(start)}.`)
}

const storeRepoMetadata = async (repoUrl: string): Promise<void> => {
  console.log(`Processing metadata for repository ${repoUrl}...`)
  let start = performance.now()

  const repoPath = repoDirName(repoUrl)
  const git = simpleGit(repoPath)

  // Update repository meta
  const repoMeta: RepositoryMeta = {
    _id: repoUrl,
    url: repoUrl
  }

  {
    const res = await repoCol.replaceOne({ _id: repoUrl }, repoMeta, { upsert: true })
    if (!res.acknowledged) {
      throw new Error(`Failed to write repository meta for ${repoUrl}`)
    }
    console.log(`Updated repository meta in ${formatTime(start)}.`)
  }

  // Update commit metas
  start = performance.now()
  const gitLog = await git.log()
  const commits = gitLog.all.map((e): CommitMeta => ({
    ...e,
    _id: e.hash,
    repoUrl: repoUrl
  }))

  {
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
}

const runRMiner = async (repoUrl: string): Promise<void> => {
  console.log(`Running RMiner on ${repoUrl}...`)
  const filename = rminerFileName(repoUrl)
  const start = performance.now()

  // TODO

  console.log(`Completed running RMiner on ${repoUrl} in ${formatTime(start)}.`)
}

const runRefDiff = async (repoUrl: string): Promise<void> => {
  console.log(`Running RefDiff on ${repoUrl}...`)
  const filename = refDiffFileName(repoUrl)
  const start = performance.now()

  // TODO

  console.log(`Completed running RefDiff on ${repoUrl} in ${formatTime(start)}.`)
}

const processRMinerFile = async (repoUrl: string): Promise<void> => {
  const filename = rminerFileName(repoUrl)
  console.log(`Processing RMiner output file ${filename}...`)
  const start = performance.now()

  const output = JSON.parse(fs.readFileSync(filename).toString()) as RMOutput
  const refactorings = processRMinerOutput(output)
  const res = await refCol.insertMany(refactorings)

  console.log(`Processed ${output.commits.length} commits, and inserted ${res.insertedCount} refactoring instances in ${formatTime(start)}.`)
}

const processRefDiffFile = async (repoUrl: string): Promise<void> => {
  const filename = refDiffFileName(repoUrl)
  console.log(`Processing RefDiff output file ${filename}...`)
  const start = performance.now()

  const output = JSON.parse(fs.readFileSync(filename).toString()) as RefDiffOutput
  const refactorings = processRefDiffOutput(repoUrl, output)
  const res = await refCol.insertMany(refactorings)

  console.log(`Inserted ${res.insertedCount} refactoring instances in ${formatTime(start)}.`)
}

const main = async () => {
  const repos = [
    'https://github.com/motoki317/moto-bot',
    'https://github.com/gradle/gradle',
  ]

  for (const repo of repos) {
    await cloneRepo(repo)
    await storeRepoMetadata(repo)
    // await runRMiner(repo) // TODO
    // await runRefDiff(repo) // TODO
    await processRMinerFile(repo) // not idempotent
    await processRefDiffFile(repo) // not idempotent
  }

  process.exit(0)
}

main()
