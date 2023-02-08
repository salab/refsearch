import {repoDirName} from "../info";
import {calcContainerName, spawnOrError, tmpFileName} from "./common";
import {shortSha} from "../../../../common/utils";
import {refCol, toolRawDataCol} from "../../mongo";
import fs from "fs";
import {RefDiffOutput} from "../../../../common/refdiff";
import {processRefDiffOutput} from "../processor/refdiff";
import {config} from "../../config";

export const refDiffToolName = `RefDiff ${config.tool.refDiff.version}`
const shortToolName = 'refdiff'

const run = async (repoUrl: string, commit: string): Promise<void> => {
  const containerName = calcContainerName(shortToolName, shortSha(commit))
  await spawnOrError('docker', [
    'run',
    '--rm',
    '--name', containerName,
    '-v', `${config.hostDataDir}:/work`,
    '--workdir', '/work',
    config.tool.refDiff.imageName,
    '--repository', `${repoDirName(repoUrl, '/work')}/.git`,
    '--start', commit, '--depth', '1',
    '--out', tmpFileName('/work', shortToolName, repoUrl, commit),
  ])
}

const getOrRun = async (repoUrl: string, commit: string): Promise<Record<any, any>> => {
  const rawData = await toolRawDataCol.findOne({ commit: commit, tool: refDiffToolName })
  if (rawData) return rawData.data

  await run(repoUrl, commit)
  const filename = tmpFileName(config.dataDir, shortToolName, repoUrl, commit)
  const file = JSON.parse(fs.readFileSync(filename).toString())
  fs.rmSync(filename)
  await toolRawDataCol.insertOne({ commit: commit, tool: refDiffToolName, data: file })
  return file
}

export const processRefDiff = async (repoUrl: string, commit: string) => {
  const data = await getOrRun(repoUrl, commit) as RefDiffOutput
  const processed = processRefDiffOutput(repoUrl, data)
  if (processed.length > 0) await refCol.insertMany(processed as any)
}
