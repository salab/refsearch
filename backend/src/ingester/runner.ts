import {
  refDiffFileName,
  refDiffVersion,
  repoDirName,
  rminerFileName,
  rminerVersion
} from "./info";
import {spawnSync} from "child_process";
import {md5Hash} from "../utils";
import {makeSureCloned} from "./cloner";

const hostDataDir = process.env.HOST_DATA_DIR

const calcContainerName = (tool: string, repoUrl: string): string => `rs-runner-${tool}-${md5Hash(repoUrl).substring(0, 7)}`

const spawnOrError = (cmd: string, args: string[]): ReturnType<typeof spawnSync> | Error => {
  const res = spawnSync(cmd, args)
  if (res.error) {
    return res.error
  }
  if (res.status !== 0) {
    return new Error(`'${[cmd, ...args].join(' ')}' spawn error: status ${res.status}\nstdout:\n${res.stdout.toString()}\nstderr:\n${res.stderr.toString()}`)
  }
  return res
}

const getContainerLogs = (containerName: string): string | Error => {
  const res = spawnOrError('docker', ['logs', containerName])
  if (res instanceof Error) return res
  return 'stdout:\n'+res.stdout.toString()+'\nstderr:\n'+res.stderr.toString()
}

const checkContainerExited = (containerName: string): boolean | Error => {
  const res = spawnOrError('docker', ['inspect', containerName])
  if (res instanceof Error) return res

  const containerStatus = JSON.parse(res.stdout.toString())
  const running = containerStatus?.[0]?.State?.Running
  if (typeof running !== 'boolean') {
    return new Error(`docker inspect failed: unexpected running status: ${running}`)
  }
  if (running) {
    return false // not completed
  }

  const exitCode = containerStatus?.[0].State?.ExitCode
  if (exitCode !== 0) {
    const logs = getContainerLogs(containerName)
    if (logs instanceof Error) return logs
    return new Error(`container ${containerName} exited with code ${exitCode}:\n${logs}`)
  }

  return true
}

const removeContainer = (containerName: string): Error | undefined => {
  const res = spawnOrError('docker', ['rm', containerName])
  if (res instanceof Error) return res
}

export const runRMiner = async (repoUrl: string): Promise<void> => {
  await makeSureCloned(repoUrl)
  const containerName = calcContainerName('RMiner', repoUrl)

  const res = spawnOrError('docker', [
    'run',
    '-d',
    '--name', containerName,
    '-v', `${hostDataDir}:/work`,
    '--workdir', '/work',
    `refactoringminer:${rminerVersion}`,
    '-a', repoDirName(repoUrl, '/work'),
    '-json', rminerFileName(repoUrl, '/work'),
  ])
  if (res instanceof Error) throw res
}

export const runRMinerFinished = async (repoUrl: string): Promise<boolean> => {
  const containerName = calcContainerName('RMiner', repoUrl)
  const exited = checkContainerExited(containerName)
  if (exited instanceof Error) throw exited
  if (!exited) {
    return exited
  }
  const rmResult = removeContainer(containerName)
  if (rmResult instanceof Error) throw rmResult
  return exited
}

export const runRefDiff = async (repoUrl: string): Promise<void> => {
  await makeSureCloned(repoUrl)
  const containerName = calcContainerName('RefDiff', repoUrl)

  const res = spawnOrError('docker', [
    'run',
    '-d',
    '--name', containerName,
    '-v', `${hostDataDir}:/work`,
    '--workdir', '/work',
    `refdiff:${refDiffVersion}`,
    '--repository', `${repoDirName(repoUrl, '/work')}/.git`,
    '--out', refDiffFileName(repoUrl, '/work'),
  ])
  if (res instanceof Error) throw res
}

export const runRefDiffFinished = async (repoUrl: string): Promise<boolean> => {
  const containerName = calcContainerName('RefDiff', repoUrl)
  const exited = checkContainerExited(containerName)
  if (exited instanceof Error) throw exited
  if (!exited) {
    return exited
  }
  const rmResult = removeContainer(containerName)
  if (rmResult instanceof Error) throw rmResult
  return exited
}
