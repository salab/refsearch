import {Document, Filter} from "mongodb";
import {AST, parse} from "../../../../common/parser/parser.js";
import {unreachable} from "../../../../common/utils.js";
import {ParseException} from "../../../../common/parser/exception.js";
import {tokenize} from "../../../../common/parser/tokenizer.js";

const maybeParseNum = (token: string): string | number => {
  const num = +token
  if (!Number.isNaN(num)) return num
  return token
}

const astToQuery = (ast: AST): Filter<Document> => {
  switch (ast.type) {
    case "condition":
      const q = ast.rhs
      const maybeNum = maybeParseNum(q)
      switch (ast.operator) {
        case 'equal':
          return {[ast.lhs]: maybeNum}
        case 'lt':
          return {[ast.lhs]: {'$lt': maybeNum}}
        case 'lte':
          return {[ast.lhs]: {'$lte': maybeNum}}
        case 'gt':
          return {[ast.lhs]: {'$gt': maybeNum}}
        case 'gte':
          return {[ast.lhs]: {'$gte': maybeNum}}
        case 'ne':
          return {[ast.lhs]: {'$ne': maybeNum}}
        case 'regex':
          const hasOptions = q.startsWith('/') && q.lastIndexOf('/') > 0
          if (hasOptions) {
            const regex = q.substring(1, q.lastIndexOf('/'))
            const options = q.substring(q.lastIndexOf('/')+1)
            return {[ast.lhs]: {'$regex': regex, '$options': options}}
          } else {
            return {[ast.lhs]: {'$regex': q}}
          }
      }
      return unreachable(ast.operator)
    case "and":
      return {'$and': ast.children.map((c) => astToQuery(c))}
    case "or":
      return {'$or': ast.children.map((c) => astToQuery(c))}
  }
}

export const strToMongoQuery = (s: string): Filter<Document> | ParseException => {
  if (s === '') return {}

  const ast = parse(tokenize(s))
  if (ParseException.is(ast)) return ast
  return astToQuery(ast)
}
