import {repoDirName, repositoriesDir} from "./info";
import fs from "fs";
import simpleGit from "simple-git";
import {formatTime} from "../../../common/utils";
import {jobCol, repoCol} from "../mongo";
import {JobWithId} from "../jobs";

export const cloneRepository = async (job: JobWithId): Promise<void> => {
  const { repoUrl } = job.data
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

  const log = await simpleGit(dirName).log()
  const head = log.latest?.hash
  if (!head) {
    throw new Error(`[cloner] Failed to fetch head hash`)
  }

  const prev = await repoCol.findOne({ _id: job.data.repoUrl })
  let endCommit: string
  if (prev) {
    const prevEndIdx = log.all.findIndex((l) => l.hash === prev.indexedUntil)
    if (prevEndIdx === 0) throw new Error(`already indexed`) // throw error to cancel pipeline
    endCommit = prevEndIdx > 0
      ? log.all[prevEndIdx-1].hash
      : log.all[log.all.length-1].hash // index all commits in case 'indexedUntil' commit is not found
  } else {
    endCommit = log.all[log.all.length-1].hash
  }

  const res = await jobCol.updateMany({ pipeline: job.pipeline }, { $set: { 'data.startCommit': head, 'data.endCommit': endCommit } })
  if (!res.acknowledged) {
    throw new Error(`[cloner] Failed to save head hash`)
  }
}
