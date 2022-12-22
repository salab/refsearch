export const unreachable = (check: never): never => {
  throw new Error(`unreachable: ${JSON.stringify(check)}`)
}
