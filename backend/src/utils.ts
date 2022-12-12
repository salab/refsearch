export const sshUrlToHttpsUrl = (url: string): string => {
    const githubSsh = /^git@github\.com:(.+?)\/(.+?)\/([0-9a-f]{40})$/
    const githubMatch = githubSsh.exec(url)
    if (githubMatch !== null) {
        return `https://github.com/${githubMatch[1]}/${githubMatch[2]}/commit/${githubMatch[3]}`
    }
    return url
}
