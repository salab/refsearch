type R = Record<string, any>

export class HTTPStatusError extends Error {
  public readonly res: R

  public constructor(status: number, res: R) {
    super(`Unexpected status: ${status}`)
    this.res = res
  }
}
