import {repoDirName, repositoriesDir} from "./info.js";
import fs from "fs";
import simpleGit, {ResetMode} from "simple-git";
import {JobWithId} from "../jobs.js";

export const cloneRepository = async ({ data }: JobWithId): Promise<void> => {
  const repoUrl = data.repoUrl
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

    console.log(`[cloner] ${repoUrl} is already cloned at ${dirName}. Fetching...`)
    await git.fetch()
    console.log(`[cloner] Fetch complete. Resetting head...`)
    await git.reset(ResetMode.HARD, ['origin/HEAD'])
    console.log(`[cloner] Reset HEAD to origin/HEAD.`)
  } else {
    await simpleGit(repositoriesDir()).clone(repoUrl)
    console.log(`[cloner] Clone from ${repoUrl} to ${dirName} complete.`)
  }
}
