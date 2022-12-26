import {humanishName} from "../utils";
import fs from "fs";

export const repositoriesDir = './data/repos'
export const repoDirName = (repoUrl: string): string => `${repositoriesDir}/${humanishName(repoUrl)}`

export const rminerVersion = '2.3.2'
export const rminerDir = './data/rminer'
export const rminerFileName = (repoUrl: string): string => `${rminerDir}/${humanishName(repoUrl)}.json`

export const refDiffVersion = '2.0.0'
export const refDiffDir = './data/refdiff'
export const refDiffFileName = (repoUrl: string): string => `${refDiffDir}/${humanishName(repoUrl)}.json`

const makeDirIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

export const makeMissingDirs = () => [repositoriesDir, rminerDir, refDiffDir].forEach(makeDirIfNotExists)
