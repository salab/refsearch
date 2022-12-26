import {humanishName} from "../utils";
import fs from "fs";
import path from "path";

export const dataDir = path.resolve(__dirname, '../../../data')

export const repositoriesDir = (baseDir: string = dataDir) => path.resolve(baseDir, './repos')
export const repoDirName = (repoUrl: string, baseDir: string = dataDir): string => `${repositoriesDir(baseDir)}/${humanishName(repoUrl)}`

export const rminerVersion = '2.3.2'
export const rminerDir = (baseDir: string = dataDir) => path.resolve(baseDir, './rminer')
export const rminerFileName = (repoUrl: string, baseDir: string = dataDir): string => `${rminerDir(baseDir)}/${humanishName(repoUrl)}.json`

export const refDiffVersion = '2.0.0'
export const refDiffDir = (baseDir: string = dataDir) => path.resolve(baseDir, './refdiff')
export const refDiffFileName = (repoUrl: string, baseDir: string = dataDir): string => `${refDiffDir(baseDir)}/${humanishName(repoUrl)}.json`

const makeDirIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

export const makeMissingDirs = () => [repositoriesDir(), rminerDir(), refDiffDir()].forEach(makeDirIfNotExists)
