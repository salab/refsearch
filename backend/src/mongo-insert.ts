import fs from "fs";
import {extractMethodExtractedLines, extractSourceMethodsCount} from "./extractor";
import {commitsCol, refCol, repoCol} from "./mongo";
import {RMOutput, RMRefactoringType} from "../../types/rminer";
import {Commit, CommitMeta, Refactoring, RepositoryMeta} from "../../types/types";
import {humanishName, sshUrlToHttpsUrl} from "./utils";
import simpleGit from "simple-git";

const formatTime = (start: number): string => `${Math.floor(performance.now() - start) / 1000} s`

const repositoriesDir = './data/repos'
const repoDirName = (repoUrl: string): string => `${repositoriesDir}/${humanishName(repoUrl)}`

const rminerDir = './data/rminer'
const rminerFileName = (repoUrl: string): string => `${rminerDir}/${humanishName(repoUrl)}.json`

const refDiffDir = './data/refdiff'
const refDiffFileName = (repoUrl: string): string => `${refDiffDir}/${humanishName(repoUrl)}.json`

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

const processRMinerFile = async (repoUrl: string): Promise<void> => {
  const filename = rminerFileName(repoUrl)
  console.log(`Processing RMiner output file ${filename}...`)
  const start = performance.now()

  const file = fs.readFileSync(filename).toString()
  const output = JSON.parse(file) as RMOutput
  const commits = output.commits
    .map((c): Commit => {
      // Normalize to https url for convenience
      const url = sshUrlToHttpsUrl(c.url)
      const repository = sshUrlToHttpsUrl(c.repository)
      return {
        ...c,
        url,
        repository,
        refactorings: c.refactorings
          .map((r): Refactoring => ({
            ...r,
            url,
            repository,
            sha1: c.sha1,
            extractMethod: {}
          }))
      }
    })

  // Pre-compute needed information
  // Use-case 1: 重複の処理が無い / あるextract
  commits.forEach((c) => extractSourceMethodsCount(c))

  // Use-case 2: 数行のみのextract,  extractする前の行数
  commits.forEach((c) =>
    c.refactorings
      .filter((r) => r.type === RMRefactoringType.ExtractMethod)
      .forEach((r) => {
        r.extractMethod.extractedLines = extractMethodExtractedLines(r)
      }))

  const refactorings = commits.flatMap((c) => c.refactorings)
  const res = await refCol.insertMany(refactorings)
  console.log(`Processed ${commits.length} commits, and inserted ${res.insertedCount} refactoring instances in ${formatTime(start)}.`)
}

const main = async () => {
  const makeDirIfNotExists = (dir: string) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
  }
  [repositoriesDir, rminerDir, refDiffDir].forEach(makeDirIfNotExists)

  const repos = [
    'https://github.com/motoki317/moto-bot',
    'https://github.com/gradle/gradle',
  ]

  for (const repo of repos) {
    await cloneRepo(repo)
    await storeRepoMetadata(repo)
    // await runRMiner(repo) // TODO
    await processRMinerFile(repo) // not idempotent
  }

  process.exit(0)
}

main()
