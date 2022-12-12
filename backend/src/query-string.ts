import {Document, Filter} from "mongodb";

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
  regex: '~'
} as const
type TokenType = keyof typeof tokenType
type Splitter = Exclude<typeof tokenType[TokenType], ''>
const splitters = Object.values(tokenType)
  .filter((t) => t !== '')
  .sort((s1, s2) => s2.length - s1.length) as Splitter[]
const splitterReverseMap = Object.fromEntries(
  Object.entries(tokenType)
    .filter(([key]) => key !== 'word')
    .map(([key, value]) => [value, key])) as Record<Splitter, Exclude<TokenType, 'word'>>

interface Token {
  type: keyof typeof tokenType
  token: string
  index: number
}

const toValue = (token: string): string | number => {
  const num = +token
  if (!Number.isNaN(num)) return num
  return token
}

export class ParseException {
  public static readonly symbol = Symbol()
  private readonly symbol: Symbol
  public readonly message: string

  private constructor(message: string) {
    this.symbol = ParseException.symbol
    this.message = message
  }

  public static is(obj: any): obj is ParseException {
    return obj.symbol === ParseException.symbol
  }

  public static fromMessage(message: string) {
    return new ParseException(message)
  }

  public static unexpectedToken(token?: Token) {
    if (token === undefined)
      return new ParseException('unexpected end of input')
    return new ParseException(`unexpected ${token.token} at index ${token.index}`)
  }

  public static expected(token: Token | undefined, expected: string) {
    if (token === undefined)
      return new ParseException(`expected ${expected} but got end of input`)
    return new ParseException(`expected ${expected} but got ${token.token} at index ${token.index}`)
  }
}

const tokenize = (str: string): Token[] => {
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
          token: str.substring(1, nextIndex + 1)
        }, str.substring(nextIndex + 2), nextIndex + 1]
      }
    }
    if (str.startsWith("'")) {
      const nextIndex = str.substring(1).indexOf("'")
      if (nextIndex >= 0) {
        return [{
          type: 'word',
          token: str.substring(1, nextIndex + 1)
        }, str.substring(nextIndex + 2), nextIndex + 1]
      }
    }

    for (const splitter of splitters) {
      if (splitter.length <= str.length && str.startsWith(splitter)) {
        return [{
          type: splitterReverseMap[splitter],
          token: splitter
        }, str.substring(splitter.length), splitter.length]
      }
    }

    const nextIndex = Math.min(
      str.length,
      ...splitters.map((splitter) => str.indexOf(splitter)).filter((idx) => idx >= 0)
    )
    return [{
      type: 'word',
      token: str.substring(0, nextIndex).trimEnd()
    }, str.substring(nextIndex), nextIndex]
  }

  const tokens: Token[] = []
  let index = 0
  while (str.length > 0) {
    const [token, next, n] = tokenizeOnce(str)
    if (token) tokens.push({...token, index})
    str = next
    index += n
  }
  return tokens
}

/**
 * Query syntax in EBNF
 * query      = expr
 * op         = "<=" | ...
 * word       = <word>
 * expr       = logic_ors
 * logic_ors  = logic ("|" logic_ors)?
 * logic      = primary ("&" logic)?
 * primary    = word op word
 *             | "(" expr ")"
 */
class Parser {
  private tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token | undefined {
    if (this.tokens.length === 0) return undefined
    return this.tokens[0]
  }

  private consume(type?: TokenType): Token | undefined {
    if (this.tokens.length === 0) return undefined
    const next = this.tokens[0]
    if (type === undefined || next.type === type) {
      this.tokens = this.tokens.slice(1)
      return next
    }
    return undefined
  }

  private parsePrimary(): Filter<Document> | ParseException {
    if (this.consume('leftPar')) {
      const expr = this.parseExpr()
      if (!this.consume('rightPar')) return ParseException.expected(this.peek(), ')')
      return expr
    }

    const lhs = this.consume('word')
    if (lhs === undefined) return ParseException.expected(this.peek(), 'operand')
    const op = this.consume()
    if (op === undefined) return ParseException.expected(this.peek(), 'operator')
    const rhs = this.consume('word')
    if (rhs === undefined) return ParseException.expected(this.peek(), 'operand')
    switch (op?.type) {
      case 'equal':
        return {[lhs.token]: toValue(rhs.token)}
      case 'lt':
        return {[lhs.token]: {'$lt': toValue(rhs.token)}}
      case 'lte':
        return {[lhs.token]: {'$lte': toValue(rhs.token)}}
      case 'gt':
        return {[lhs.token]: {'$gt': toValue(rhs.token)}}
      case 'gte':
        return {[lhs.token]: {'$gte': toValue(rhs.token)}}
      case 'ne':
        return {[lhs.token]: {'$ne': toValue(rhs.token)}}
      case 'regex':
        return {[lhs.token]: {'$regex': toValue(rhs.token)}}
      default:
        return ParseException.unexpectedToken(op)
    }
  }

  private parseLogic(): Filter<Document> | ParseException {
    const primary = this.parsePrimary()
    if (ParseException.is(primary)) return primary
    if (this.consume('and')) {
      const rhs = this.parseLogic()
      if (ParseException.is(rhs)) return rhs
      return {'$and': [primary, rhs]}
    }
    return primary
  }

  private parseLogicOrs(): Filter<Document> | ParseException {
    const logic = this.parseLogic()
    if (ParseException.is(logic)) return logic
    if (this.consume('or')) {
      const rhs = this.parseLogicOrs()
      if (ParseException.is(rhs)) return rhs
      return {'$or': [logic, rhs]}
    }
    return logic
  }

  private parseExpr(): Filter<Document> | ParseException {
    return this.parseLogicOrs()
  }

  public parse(): Filter<Document> | ParseException {
    if (this.peek() === undefined) return {}

    const expr = this.parseExpr()
    const next = this.peek()
    if (next !== undefined) return ParseException.expected(next, 'end of input')
    return expr
  }
}

export const strToMongoQuery = (s: string): Filter<Document> | ParseException => {
  const tokens = tokenize(s)
  const parser = new Parser(tokens)
  return parser.parse()
}
