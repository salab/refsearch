import {repoDirName, repositoriesDir} from "../info";
import fs from "fs";
import simpleGit from "simple-git";
import {formatTime} from "../utils";

export const makeSureCloned = async (repoUrl: string): Promise<void> => {
  const dirName = repoDirName(repoUrl)

  if (fs.existsSync(dirName)) {
    const git = simpleGit(dirName)
    const existingRemote = await git.remote(['get-url', 'origin'])
    if (!existingRemote) {
      throw new Error(`[cloner] Failed to exec git remote get-url origin in ${dirName}`)
    }

    if (repoUrl === existingRemote.trim()) {
      const start = performance.now()
      await git.fetch()
      console.log(`[cloner] ${repoUrl} is already cloned at ${dirName}. Fetch complete in ${formatTime(start)}.`)
      return
    } else {
      console.log(`[cloner] Found another repo at path ${dirName} (${existingRemote}), will delete the current one.`)
      fs.rmSync(dirName, { recursive: true })
      // fallthrough
    }
  }

  const start = performance.now()
  await simpleGit(repositoriesDir).clone(repoUrl)
  console.log(`[cloner] Clone from ${repoUrl} to ${dirName} complete in ${formatTime(start)}.`)
}
