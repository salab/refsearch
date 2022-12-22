import {refDiffFileName, rminerFileName} from "../info";
import {formatTime} from "../utils";

export const runRMiner = async (repoUrl: string): Promise<void> => {
  console.log(`Running RMiner on ${repoUrl}...`)
  const filename = rminerFileName(repoUrl)
  const start = performance.now()

  // TODO

  console.log(`Completed running RMiner on ${repoUrl} in ${formatTime(start)}.`)
}

export const runRefDiff = async (repoUrl: string): Promise<void> => {
  console.log(`Running RefDiff on ${repoUrl}...`)
  const filename = refDiffFileName(repoUrl)
  const start = performance.now()

  // TODO

  console.log(`Completed running RefDiff on ${repoUrl} in ${formatTime(start)}.`)
}
