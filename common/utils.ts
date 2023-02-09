export const unreachable = (check: never): never => {
  throw new Error(`unreachable: ${JSON.stringify(check)}`)
}

export const formatDurationHuman = (millis: number): string => {
  let seconds = Math.floor(millis / 1000)
  millis -= seconds * 1000
  let minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  let hours = Math.floor(minutes / 60)
  minutes -= hours * 60
  let days = Math.floor(hours / 24)
  hours -= days * 24
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
  if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''}`
  return `${millis} millisecond${millis !== 1 ? 's' : ''}`
}
export const formatDuration = (millis: number): string => `${Math.floor(millis) / 1000} s`
export const formatTime = (start: number, end: number = performance.now()): string => formatDuration(end - start)

export const fromGitHub = (url: string) => url.startsWith('https://github.com/')
export const gitHubRepoName = (url: string) => url.substring('https://github.com/'.length)

export const shortSha = (sha1: string) => sha1.substring(0, 7)

export const batch = <T>(arr: T[], size: number): T[][] => {
  const nBatches = Math.ceil(arr.length / size)
  const batches: T[][] = []
  for (let i = 0; i < nBatches; i++) {
    batches.push(arr.slice(i * size, Math.min(arr.length, (i+1) * size)))
  }
  return batches
}

export const sequentialBatch = <T>(arr: T[], include: (t: T) => boolean): T[][] => {
  const findFrom = (c: boolean, from: number): number => {
    const idx = arr.slice(from).findIndex((elt) => include(elt) === c)
    return idx >= 0 ? idx + from : arr.length
  }

  const batches: T[][] = []
  let i = 0
  while (i < arr.length) {
    const end = findFrom(false, i)
    if (i < end) {
      batches.push(arr.slice(i, end))
    }
    i = findFrom(true, end)
  }
  return batches
}
