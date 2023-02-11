import fetch from "node-fetch";
import {config} from "../../config";
import {URLSearchParams} from "url";
import {humanishName} from "../../utils";
import {RMRefactoring} from "../../../../common/rminer";
import {HTTPStatusError} from "../error";

const baseUrl = `http://${config.tool.rminer.host}:${config.tool.rminer.port}/detect`

export const detectRMinerRefactorings = async (repoUrl: string, commit: string, timeoutSeconds: number): Promise<RMRefactoring[]> => {
  const json = await fetch(baseUrl + '?' + new URLSearchParams({
    dir: config.tool.rminer.baseRepoPath + '/' + humanishName(repoUrl),
    commit: commit,
    timeout: '' + timeoutSeconds,
  }).toString())
    .then((r) => {
      if (r.status !== 200) throw new HTTPStatusError(r.status, r.json())
      return r
    })
    .then((r) => r.json())
  return json as RMRefactoring[]
}
