import {repoDirName} from "../info";
import {calcContainerName, spawnOrError, tmpFileName} from "./common";
import {refCol, toolRawDataCol} from "../../mongo";
import {shortSha} from "../../../../common/utils";
import fs from "fs";
import {RMOutput} from "../../../../common/rminer";
import {processRMinerOutput} from "../processor/rminer";
import {config} from "../../config";

export const rminerToolName = `RefactoringMiner ${config.tool.rminer.version}`
const shortToolName = 'rminer'

const run = async (repoUrl: string, commit: string): Promise<void> => {
  const containerName = calcContainerName(shortToolName, shortSha(commit))
  await spawnOrError('docker', [
    'run',
    '--rm',
    '--name', containerName,
    '-v', `${config.hostDataDir}:/work`,
    '--workdir', '/work',
    config.tool.rminer.imageName,
    // 'start commit' required by RMiner is before in chronological order, whereas 'data.startCommit' is after
    '-c', repoDirName(repoUrl, '/work'), commit,
    '-json', tmpFileName('/work', shortToolName, repoUrl, commit),
  ])
}

const getOrRun = async (repoUrl: string, commit: string): Promise<Record<any, any>> => {
  const rawData = await toolRawDataCol.findOne({ commit: commit, tool: rminerToolName })
  if (rawData) return rawData.data

  await run(repoUrl, commit)
  const filename = tmpFileName(config.dataDir, shortToolName, repoUrl, commit)
  const file = JSON.parse(fs.readFileSync(filename).toString())
  fs.rmSync(filename)
  await toolRawDataCol.insertOne({ commit: commit, tool: rminerToolName, data: file })
  return file
}

export const processRMiner = async (repoUrl: string, commit: string) => {
  const data = await getOrRun(repoUrl, commit) as RMOutput
  const processed = processRMinerOutput(data)
  if (processed.length > 0) await refCol.insertMany(processed as any)
}
