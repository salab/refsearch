import {execFile} from "child_process";
import path from "path";
import {tmpDir} from "../info";
import {md5Hash} from "../../utils";

const maxLogLength = 10000

const trimStart = (s: string, maxLen: number) => s.length <= maxLen ? s : `(... trimmed ${s.length - maxLen} chars at start)\n${s.substring(s.length - maxLen, s.length)}`
const formatOutput = (stdout: string, stderr: string): string => `stdout:
${trimStart(stdout, maxLogLength)}
stderr:
${trimStart(stderr, maxLogLength)}`

export const spawnOrError = (cmd: string, args: string[], timeoutMillis: number): Promise<[string, string]> => {
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

export const containerName = (tool: string, discriminator: string): string => `rs-runner-${tool}-${discriminator}`
export const tmpFileName = (baseDir: string, toolName: string, repoUrl: string, discriminator: string) =>
  path.resolve(tmpDir(baseDir), md5Hash(toolName + repoUrl + discriminator).substring(0, 7) + '.json')
