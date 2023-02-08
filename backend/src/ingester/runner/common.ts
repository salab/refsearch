import {exec, execFile, spawnSync} from "child_process";
import {shortSha} from "../../../../common/utils";
import path from "path";
import {tmpDir} from "../info";
import {md5Hash} from "../../utils";

const timeoutMillis = 60 * 1000
const maxLogLength = 10000
export const calcContainerName = (tool: string, commit: string): string => `rs-runner-${tool}-${shortSha(commit)}`

const trimStart = (s: string, maxLen: number) => s.length <= maxLen ? s : `(... trimmed ${s.length - maxLen} chars at start)\n${s.substring(s.length - maxLen, s.length)}`
const formatOutput = (stdout: string, stderr: string): string => `stdout:
${trimStart(stdout, maxLogLength)}
stderr:
${trimStart(stderr, maxLogLength)}`

export const spawnOrError = (cmd: string, args: string[]): Promise<[string, string]> => {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: timeoutMillis },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`'${[cmd, ...args].join(' ')}' exec error: status ${error.code}\n${formatOutput(stdout, stderr)}`))
        } else {
          resolve([stdout, stderr])
        }
      })
  })
}

export const tmpFileName = (baseDir: string, toolName: string, repoUrl: string, commit: string) =>
  path.resolve(tmpDir(baseDir), md5Hash(toolName + repoUrl + commit).substring(0, 7))
