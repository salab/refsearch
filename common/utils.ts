export const unreachable = (check: never): never => {
  throw new Error(`unreachable: ${JSON.stringify(check)}`)
}

export const formatDuration = (millis: number): string => `${Math.floor(millis) / 1000} s`
export const formatTime = (start: number, end: number = performance.now()): string => formatDuration(end - start)
