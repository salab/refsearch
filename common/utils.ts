export const unreachable = (check: never): never => {
  throw new Error(`unreachable: ${JSON.stringify(check)}`)
}

export const formatDuration = (millis: number): string => `${Math.floor(millis) / 1000} s`
export const formatTime = (start: number, end: number = performance.now()): string => formatDuration(end - start)

export const fromGitHub = (url: string) => url.startsWith('https://github.com/')
export const gitHubRepoName = (url: string) => url.substring('https://github.com/'.length)

export const shortSha = (sha1: string) => sha1.substring(0, 7)
