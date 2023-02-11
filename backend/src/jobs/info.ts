import {humanishName} from "../utils";
import fs from "fs";
import path from "path";
import {config} from "../config";

export const repositoriesDir = (baseDir: string = config.dataDir) => path.resolve(baseDir, './repos')
export const repoDirName = (repoUrl: string, baseDir: string = config.dataDir): string => `${repositoriesDir(baseDir)}/${humanishName(repoUrl)}`

const makeDirIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

export const makeMissingDirs = () => [repositoriesDir()].forEach(makeDirIfNotExists)
