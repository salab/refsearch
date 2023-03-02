const tokenType = {
  word: '',
  leftPar: '(',
  rightPar: ')',
  and: '&',
  or: '|',
  equal: '=',
  lt: '<',
  lte: '<=',
  gt: '>',
  gte: '>=',
  ne: '!=',
  regex: '~',
} as const

export type TokenType = keyof typeof tokenType
export type Splitter = Exclude<typeof tokenType[TokenType], ''>

export interface Token {
  type: TokenType
  token: string
  index: number
}

const splitters = Object.values(tokenType)
  .filter((t) => t !== '')
  .sort((s1, s2) => s2.length - s1.length) as Splitter[]
const splitterReverseMap = Object.fromEntries(
  Object.entries(tokenType)
    .filter(([key]) => key !== 'word')
    .map(([key, value]) => [value, key])) as Record<Splitter, Exclude<TokenType, 'word'>>

export const tokenize = (str: string): Token[] => {
  const tokenizeOnce = (str: string): [token: Pick<Token, 'type' | 'token'> | undefined, next: string, n: number] => {
    const trimmed = str.trimStart()
    if (trimmed !== str) {
      const trimmedLen = str.indexOf(trimmed)
      return [undefined, trimmed, trimmedLen]
    }

    if (str.startsWith('"')) {
      const nextIndex = str.substring(1).indexOf('"')
      if (nextIndex >= 0) {
        return [{
          type: 'word',
          token: str.substring(1, nextIndex + 1),
        }, str.substring(nextIndex + 2), nextIndex + 1]
      }
    }
    if (str.startsWith('\'')) {
      const nextIndex = str.substring(1).indexOf('\'')
      if (nextIndex >= 0) {
        return [{
          type: 'word',
          token: str.substring(1, nextIndex + 1),
        }, str.substring(nextIndex + 2), nextIndex + 1]
      }
    }

    for (const splitter of splitters) {
      if (splitter.length <= str.length && str.startsWith(splitter)) {
        return [{
          type: splitterReverseMap[splitter],
          token: splitter,
        }, str.substring(splitter.length), splitter.length]
      }
    }

    const nextIndex = Math.min(
      str.length,
      ...splitters.map((splitter) => str.indexOf(splitter)).filter((idx) => idx >= 0),
    )
    return [{
      type: 'word',
      token: str.substring(0, nextIndex).trimEnd(),
    }, str.substring(nextIndex), nextIndex]
  }

  const tokens: Token[] = []
  let index = 0
  while (str.length > 0) {
    const [token, next, n] = tokenizeOnce(str)
    if (token) tokens.push({ ...token, index })
    str = next
    index += n
  }
  return tokens
}
