import {Document, Filter} from "mongodb";
import {ParseException} from "../../common/parser/exception";
import {tokenize} from "../../common/parser/tokenizer";
import {AST, parse} from "../../common/parser/parser";
import {unreachable} from "../../common/utils";

const maybeParseNum = (token: string): string | number => {
  const num = +token
  if (!Number.isNaN(num)) return num
  return token
}

const astToQuery = (ast: AST): Filter<Document> => {
  switch (ast.type) {
    case "condition":
      const rhs = maybeParseNum(ast.rhs)
      switch (ast.operator) {
        case 'equal':
          return {[ast.lhs]: rhs}
        case 'lt':
          return {[ast.lhs]: {'$lt': rhs}}
        case 'lte':
          return {[ast.lhs]: {'$lte': rhs}}
        case 'gt':
          return {[ast.lhs]: {'$gt': rhs}}
        case 'gte':
          return {[ast.lhs]: {'$gte': rhs}}
        case 'ne':
          return {[ast.lhs]: {'$ne': rhs}}
        case 'regex':
          return {[ast.lhs]: {'$regex': rhs}}
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
