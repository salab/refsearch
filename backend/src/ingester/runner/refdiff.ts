import {repoDirName} from "../info";
import {containerName, spawnOrError, tmpFileName} from "./common";
import {refCol, toolRawDataCol} from "../../mongo";
import fs from "fs";
import {RefDiffCommit, RefDiffOutput} from "../../../../common/refdiff";
import {processRefDiffOutput} from "../processor/refdiff";
import {config} from "../../config";
import {CommitProcessState} from "../../../../common/common";
import {md5Hash, readAllFromCursor} from "../../utils";

export const refDiffToolName = 'RefDiff'
const shortToolName = 'refdiff'
const timeoutMillis = 3 * 60 * 1000

const run = async (repoUrl: string, commits: string[], discriminator: string): Promise<void> => {
  await spawnOrError('docker', [
    'run',
    '--rm',
    '--name', containerName(shortToolName, discriminator),
    '-v', `${config.hostDataDir}:/work`,
    '--workdir', '/work',
    config.tool.refDiff.imageName,
    '--repository', `${repoDirName(repoUrl, '/work')}/.git`,
    '--start', commits[commits.length-1], '--end', commits[0],
    '--out', tmpFileName('/work', shortToolName, repoUrl, discriminator),
  ], timeoutMillis)
}

const getOrRun = async (repoUrl: string, commits: string[]): Promise<RefDiffOutput> => {
  const rawData = await readAllFromCursor(toolRawDataCol.find({ commit: { $in: commits }, tool: refDiffToolName }))
  const existing = new Set(rawData.map((d) => d.commit))
  const toRun = commits.filter((c) => !existing.has(c))
  if (toRun.length === 0) return rawData.map((d) => d.data as RefDiffCommit)

  const discriminator = md5Hash(commits.join('')).substring(0, 7)
  await run(repoUrl, commits, discriminator)

  const filename = tmpFileName(config.dataDir, shortToolName, repoUrl, discriminator)
  const file = JSON.parse(fs.readFileSync(filename).toString()) as RefDiffOutput
  fs.rmSync(filename)

  if (file.length > 0) {
    const insertRes = await toolRawDataCol.bulkWrite(
      file.map((c) => ({
        replaceOne: {
          filter: {commit: c.sha1, tool: refDiffToolName},
          replacement: {commit: c.sha1, tool: refDiffToolName, data: c},
          upsert: true,
        }
      })),
      {ordered: false}
    )
    if (!insertRes.ok) throw new Error('Failed to insert refdiff raw data')
  }

  return file
}

export const processRefDiff = async (repoUrl: string, commits: string[]): Promise<Record<string, CommitProcessState>> => {
  const data = await getOrRun(repoUrl, commits)
  const processed = processRefDiffOutput(repoUrl, data)
  if (processed.length > 0) await refCol.insertMany(processed)
  const ok = new Set(data.map((d) => d.sha1))
  return Object.fromEntries(commits.map((c) => [c, ok.has(c) ? CommitProcessState.OK : CommitProcessState.NG]))
}
