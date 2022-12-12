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
