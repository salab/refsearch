import {Token, TokenType} from "./tokenizer";
import {ParseException} from "./exception";

const astOperators = ['equal', 'ne', 'lt', 'lte', 'gt', 'gte', 'regex'] as const satisfies readonly TokenType[]
export type ASTOperator = typeof astOperators extends (infer T)[] ? T : never

const isValidASTOperator = (type: TokenType): type is ASTOperator => (astOperators as readonly string[]).includes(type)

export interface ASTNodeCondition {
  type: 'condition'
  lhs: string
  operator: ASTOperator
  rhs: string
}
export interface ASTNodeOr {
  type: 'or'
  children: AST[]
}
export interface ASTNodeAnd {
  type: 'and'
  children: AST[]
}

export type AST = ASTNodeCondition | ASTNodeOr | ASTNodeAnd

/**
 * Query syntax in EBNF
 * query      = expr
 * op         = "<=" | ...
 * word       = <word>
 * expr       = logic_ors
 * logic_ors  = logic ("|" logic_ors)?  // = logic ("|" logic)*
 * logic      = primary ("&" logic)?    // = primary ("&" primary)*
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

  private parsePrimary(): AST | ParseException {
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

    if (!isValidASTOperator(op.type)) {
      return ParseException.unexpectedToken(op)
    }

    return {
      type: 'condition',
      lhs: lhs.token,
      operator: op.type,
      rhs: rhs.token,
    }
  }

  private parseLogic(): AST | ParseException {
    const primary = this.parsePrimary()
    if (ParseException.is(primary)) return primary
    if (this.peek()?.type !== 'and') {
      return primary
    }

    const children: AST[] = [primary]
    while (this.consume('and')) {
      const primary = this.parsePrimary()
      if (ParseException.is(primary)) return primary
      children.push(primary)
    }
    return { type: 'and', children }
  }

  private parseLogicOrs(): AST | ParseException {
    const logic = this.parseLogic()
    if (ParseException.is(logic)) return logic
    if (this.peek()?.type !== 'or') {
      return logic
    }

    const children: AST[] = [logic]
    while (this.consume('or')) {
      const logic = this.parseLogic()
      if (ParseException.is(logic)) return logic
      children.push(logic)
    }
    return { type: 'or', children }
  }

  private parseExpr(): AST | ParseException {
    return this.parseLogicOrs()
  }

  public parse(): AST | ParseException {
    const expr = this.parseExpr()
    if (ParseException.is(expr)) return expr
    const next = this.peek()
    if (next !== undefined) return ParseException.expected(next, 'end of input')
    return expr
  }
}

export const parse = (tokens: Token[]): AST | ParseException => {
  const parser = new Parser(tokens)
  return parser.parse()
}
