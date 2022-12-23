import {refDiffFileName, rminerFileName} from "../info";
import {formatTime} from "../utils";

export const runRMiner = async (repoUrl: string): Promise<void> => {
  const start = performance.now()

  const filename = rminerFileName(repoUrl)
  // TODO

  console.log(`[runner > rminer] Completed on ${repoUrl} in ${formatTime(start)}.`)
}

export const runRefDiff = async (repoUrl: string): Promise<void> => {
  const start = performance.now()

  const filename = refDiffFileName(repoUrl)
  // TODO

  console.log(`[runner > refdiff] Completed on ${repoUrl} in ${formatTime(start)}.`)
}
