import {repoDirName, repositoriesDir} from "./info";
import fs from "fs";
import simpleGit from "simple-git";
import {formatTime} from "../../../common/utils";
import {jobCol, repoCol} from "../mongo";
import {JobWithId} from "../jobs";

export const cloneRepository = async (repoUrl: string): Promise<void> => {
  const dirName = repoDirName(repoUrl)

  if (fs.existsSync(dirName)) {
    const git = simpleGit(dirName)
    const existingRemote = await git.remote(['get-url', 'origin'])
    if (!existingRemote) {
      throw new Error(`[cloner] Failed to exec git remote get-url origin in ${dirName}`)
    }
    if (repoUrl !== existingRemote.trim()) {
      throw new Error(`[cloner] Found another repo at path ${dirName} (${existingRemote})`)
    }

    const start = performance.now()
    await git.fetch()
    console.log(`[cloner] ${repoUrl} is already cloned at ${dirName}. Fetch complete in ${formatTime(start)}.`)
  } else {
    const start = performance.now()
    await simpleGit(repositoriesDir()).clone(repoUrl)
    console.log(`[cloner] Clone from ${repoUrl} to ${dirName} complete in ${formatTime(start)}.`)
  }
}

const calcNextRange = async (job: JobWithId): Promise<[next: boolean, start: string, end: string]> => {
  const dirName = repoDirName(job.data.repoUrl)

  const log = await simpleGit(dirName).log()
  const start = log.latest?.hash
  if (!start) {
    throw new Error(`[cloner] Failed to fetch head hash`)
  }

  const prev = await repoCol.findOne({ _id: job.data.repoUrl })
  let end: string
  if (prev) {
    const prevEndIdx = log.all.findIndex((l) => l.hash === prev.indexedUntil)
    if (prevEndIdx === 0) {
      // already indexed
      return [false, '', '']
    }
    end = prevEndIdx > 0
      ? log.all[prevEndIdx-1].hash
      : log.all[log.all.length-1].hash // index all commits in case 'indexedUntil' commit is not found
  } else {
    end = log.all[log.all.length-1].hash
  }

  return [true, start, end]
}

export const cloneAndCalcNextRange = async (job: JobWithId): Promise<void> => {
  await cloneRepository(job.data.repoUrl)
  const [next, start, end] = await calcNextRange(job)
  if (!next) {
    // Skip all pipeline jobs if already indexed
    const res = await jobCol.updateMany({ pipeline: job.pipeline, _id: { $ne: job._id } }, { $set: { skip: true } })
    if (!res.acknowledged) {
      throw new Error(`[cloner] Failed to skip pipeline`)
    }
    return
  }
  const res = await jobCol.updateMany({ pipeline: job.pipeline }, { $set: { 'data.startCommit': start, 'data.endCommit': end } })
  if (!res.acknowledged) {
    throw new Error(`[cloner] Failed to save head hash`)
  }
}
