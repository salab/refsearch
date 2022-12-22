import {Token} from "./tokenizer";

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
