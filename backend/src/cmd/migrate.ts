import {refCol, repoCol} from "../mongo";
import {readAllFromCursor} from "../utils";
import {formatTime} from "../../../common/utils";
import {ingestRefDiffFile, ingestRMinerFile} from "../ingester/fileReader";
import {refDiffFileName, repoDirName, rminerFileName} from "../ingester/info";
import fs from "fs";
import {JobWithId} from "../jobs";
import {storeMetadata} from "../ingester/metadata";
import simpleGit from "simple-git";
import {JobData} from "../../../common/jobs";
import {cloneRepository} from "../ingester/cloner";

const getStartEnd = async (repoUrl: string): Promise<[start: string, end: string]> => {
  const dirName = repoDirName(repoUrl)
  const log = await simpleGit(dirName).log()
  const head = log.latest?.hash
  if (!head) {
    throw new Error(`[cloner] Failed to fetch head hash`)
  }
  const endCommit = log.all[log.all.length-1].hash
  return [head, endCommit]
}

// Re-read rminer / refdiff output files
const main = async () => {
  const repos = await readAllFromCursor(repoCol.find())
  for (const repo of repos) {
    console.log(`start ${repo._id}...`)
    const start = performance.now()

    try {
      await refCol.deleteMany({repository: repo._id})

      await cloneRepository(repo._id)
      const [start, end] = await getStartEnd(repo._id)
      const data: JobData = { repoUrl: repo._id, startCommit: start, endCommit: end }
      if (fs.existsSync(rminerFileName(repo._id))) {
        await ingestRMinerFile({data} as JobWithId)
      }
      if (fs.existsSync(refDiffFileName(repo._id))) {
        await ingestRefDiffFile({data} as JobWithId)
      }
      await storeMetadata({data} as JobWithId)
    } catch (e) {
      console.log(`errored for ${repo._id}`)
      console.trace(e)
      continue
    }

    console.log(`finished ${repo._id} in ${formatTime(start)}`)
  }

  process.exit(0)
}

main()
