import {repoDirName} from "../info";
import {containerName, spawnOrError, tmpFileName} from "./common";
import {refCol, toolRawDataCol} from "../../mongo";
import fs from "fs";
import {RMCommit, RMOutput} from "../../../../common/rminer";
import {processRMinerOutput} from "../processor/rminer";
import {config} from "../../config";
import {CommitProcessState} from "../../../../common/common";
import {md5Hash, readAllFromCursor} from "../../utils";

export const rminerToolName = 'RefactoringMiner'
const shortToolName = 'rminer'
const timeoutMillis = 5 * 60 * 1000

const run = async (repoUrl: string, commits: string[], discriminator: string): Promise<void> => {
  await spawnOrError('docker', [
    'run',
    '--rm',
    '--name', containerName(shortToolName, discriminator),
    '-v', `${config.hostDataDir}:/work`,
    '--workdir', '/work',
    config.tool.rminer.imageName,
    // 'start commit' required by RMiner is before in chronological order
    '-bc', repoDirName(repoUrl, '/work'), `${commits[0]}^`, commits[commits.length-1],
    '-json', tmpFileName('/work', shortToolName, repoUrl, discriminator),
  ], timeoutMillis)
}

const getOrRun = async (repoUrl: string, commits: string[]): Promise<RMOutput> => {
  const rawData = await readAllFromCursor(toolRawDataCol.find({ commit: { $in: commits }, tool: rminerToolName }))
  const existing = new Set(rawData.map((d) => d.commit))
  const toRun = commits.filter((c) => !existing.has(c))
  if (toRun.length === 0) return { commits: rawData.map((d) => d.data as RMCommit) }

  const discriminator = md5Hash(commits.join('')).substring(0, 7)
  await run(repoUrl, commits, discriminator)

  const filename = tmpFileName(config.dataDir, shortToolName, repoUrl, discriminator)
  const file = JSON.parse(fs.readFileSync(filename).toString()) as RMOutput
  fs.rmSync(filename)

  if (file.commits.length > 0) {
    const insertRes = await toolRawDataCol.bulkWrite(
      file.commits.map((c) => ({
        replaceOne: {
          filter: {commit: c.sha1, tool: rminerToolName},
          replacement: {commit: c.sha1, tool: rminerToolName, data: c},
          upsert: true,
        }
      })),
      {ordered: false}
    )
    if (!insertRes.ok) throw new Error('Failed to insert rminer raw data')
  }

  return file
}

export const processRMiner = async (repoUrl: string, commits: string[]): Promise<Record<string, CommitProcessState>> => {
  const data = await getOrRun(repoUrl, commits)
  const processed = processRMinerOutput(data)
  if (processed.length > 0) await refCol.insertMany(processed)
  const ok = new Set(data.commits.map((c) => c.sha1))
  return Object.fromEntries(commits.map((c) => [c, ok.has(c) ? CommitProcessState.OK : CommitProcessState.NG]))
}
