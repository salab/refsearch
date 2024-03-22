import fetch from 'node-fetch'
import { config } from '../../config.js'
import { URLSearchParams } from 'url'
import { humanishName } from '../../utils.js'
import { RMRefactoring } from '../../../../common/rminer.js'
import { HTTPStatusError } from '../error.js'
import { memo } from '../../../../common/utils.js'

const baseUrl = memo(() => `http://${config().tool.rminer.host}:${config().tool.rminer.port}/detect`)

export const detectRMinerRefactorings = async (repoUrl: string, commit: string, timeoutSeconds: number): Promise<RMRefactoring[]> => {
  const json = await fetch(baseUrl() + '?' + new URLSearchParams({
    dir: config().tool.rminer.baseRepoPath + '/' + humanishName(repoUrl),
    commit: commit,
    timeout: '' + timeoutSeconds,
  }).toString())
    .then(async (r) => {
      if (r.status !== 200) {
        throw new HTTPStatusError(r.status, await r.json() as any)
      }
      return r
    })
    .then((r) => r.json())
  return json as RMRefactoring[]
}
