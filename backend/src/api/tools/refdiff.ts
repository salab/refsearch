import fetch from 'node-fetch'
import { config } from '../../config.js'
import { URLSearchParams } from 'url'
import { humanishName } from '../../utils.js'
import { RefDiffRefactoring } from '../../../../common/refdiff.js'
import { HTTPStatusError } from '../error.js'
import { memo } from '../../../../common/utils.js'

const baseUrl = memo(() => `http://${config().tool.refDiff.host}:${config().tool.refDiff.port}/detect`)

export const detectRefDiffRefactorings = async (repoUrl: string, commit: string, timeoutSeconds: number): Promise<RefDiffRefactoring[]> => {
  const json = await fetch(baseUrl() + '?' + new URLSearchParams({
    dir: config().tool.refDiff.baseRepoPath + '/' + humanishName(repoUrl) + '/.git',
    commit: commit,
    timeout: '' + timeoutSeconds,
  }).toString())
    .then((r) => {
      if (r.status !== 200) throw new HTTPStatusError(r.status, r.json())
      return r
    })
    .then((r) => r.json())
  return json as RefDiffRefactoring[]
}
