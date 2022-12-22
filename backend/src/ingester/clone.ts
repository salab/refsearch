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
