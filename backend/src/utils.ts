export const sshUrlToHttpsUrl = (url: string): string => {
  const replacements: [RegExp, (match: string[]) => string][] = [
    [
      /^git@github\.com:(.+?)\/(.+?)\.git$/,
      (match) => `https://github.com/${match[1]}/${match[2]}`
    ],
    [
      /^git@github\.com:(.+?)\/(.+?)\/([0-9a-f]{40})$/,
      (match) => `https://github.com/${match[1]}/${match[2]}/commit/${match[3]}`
    ]
  ]

  for (const [regexp, replace] of replacements) {
    const matched = regexp.exec(url)
    if (matched !== null) {
      return replace(matched)
    }
  }
  return url
}

// Extract "humanish" name for repository url used by `git clone`
export const humanishName = (repoUrl: string): string => {
  if (repoUrl.endsWith('.git')) {
    repoUrl = repoUrl.substring(0, repoUrl.length - '.git'.length)
  }
  while (repoUrl.endsWith('/')) {
    repoUrl = repoUrl.substring(0, repoUrl.length - 1)
  }
  const match = /^.+?([a-zA-Z0-9_-]+)$/.exec(repoUrl)
  if (match === null) {
    return repoUrl
  }
  return match[1]
}
