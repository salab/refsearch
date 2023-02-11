type R = Record<string, any>

export class HTTPStatusError extends Error {
  private readonly status: number
  private readonly res: R

  public constructor(status: number, res: R) {
    super()
    this.status = status
    this.res = res
  }

  public get message(): string {
    return `Unexpected status: ${this.status}: ${JSON.stringify(this.res)}`
  }
}
