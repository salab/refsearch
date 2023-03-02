import { createHash } from 'crypto'

export const sshUrlToHttpsUrl = (url: string): string => {
  const replacements: [RegExp, (match: string[]) => string][] = [
    [
      /^git@github\.com:(.+?)\/(.+?)\.git$/,
      (match) => `https://github.com/${match[1]}/${match[2]}`,
    ],
    [
      /^git@github\.com:(.+?)\/(.+?)\/([0-9a-f]{40})$/,
      (match) => `https://github.com/${match[1]}/${match[2]}/commit/${match[3]}`,
    ],
  ]

  for (const [regexp, replace] of replacements) {
    const matched = regexp.exec(url)
    if (matched !== null) {
      return replace(matched)
    }
  }
  return url
}

export const commitUrl = (repoUrl: string, sha1: string) => {
  const replacements: [RegExp, (match: string[]) => string][] = [
    [
      /^https:\/\/github\.com\/(.+?)\/(.+?)$/,
      (match) => `https://github.com/${match[1]}/${match[2]}/commit/${sha1}`,
    ],
  ]

  for (const [regexp, replace] of replacements) {
    const matched = regexp.exec(repoUrl)
    if (matched !== null) {
      return replace(matched)
    }
  }
  return repoUrl
}

// Extract "humanish" name for repository url used by `git clone`
export const humanishName = (repoUrl: string): string => {
  if (repoUrl.endsWith('.git')) {
    repoUrl = repoUrl.substring(0, repoUrl.length - '.git'.length)
  }
  while (repoUrl.endsWith('/')) {
    repoUrl = repoUrl.substring(0, repoUrl.length - 1)
  }
  const match = /\/([^/]+?)$/.exec(repoUrl)
  if (match === null) {
    return repoUrl
  }
  return match[1]
}

export const md5Hash = (s: string): string => {
  const h = createHash('md5')
  return h.update(s).digest('hex')
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

interface Cursor<T> {
  forEach: (callback: (doc: T) => void) => Promise<void>
}

export const readAllFromCursor = async <T>(cursor: Cursor<T>): Promise<T[]> => {
  const res: T[] = []
  await cursor.forEach((doc) => {
    res.push(doc)
  })
  return res
}
