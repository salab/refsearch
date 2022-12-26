import {refDiffFileName, rminerFileName} from "./info";

export const runRMiner = async (repoUrl: string): Promise<void> => {
  const filename = rminerFileName(repoUrl)
  // TODO
}

export const runRMinerFinished = async (repoUrl: string): Promise<boolean> => {
  // TODO
  return true
}

export const runRefDiff = async (repoUrl: string): Promise<void> => {
  const filename = refDiffFileName(repoUrl)
  // TODO
}

export const runRefDiffFinished = async (repoUrl: string): Promise<boolean> => {
  // TODO
  return true
}
