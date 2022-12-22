import React, {FunctionComponent, useEffect, useState} from "react";
import {Button, Checkbox, Divider, FormControl, ListItemText, MenuItem, Select, TextField} from "@mui/material";
import {RefactoringType} from "../../../common/common";
import {SearchField} from "./SearchField";
import {ASTNodeCondition, ASTNodeOr, parse} from "../../../common/parser/parser";
import {tokenize} from "../../../common/parser/tokenizer";
import {ParseException} from "../../../common/parser/exception";

const examples = {
  // Use-case 1: 重複の処理が無いextract
  useCase1: 'type = "Extract Method" & extractMethod.sourceMethodsCount > 1',
  // Use-case 2: 数行のみのextract,  extractする前の行数
  useCase2: 'type = "Extract Method" & extractMethod.extractedLines >= 3'
  // TODO: Use-case 3: 具体的なrenameした単語
} as const

interface RichFields {
  types: string[]
  commit: string
  repository: string
}

const richFieldsToRaw = ({types, commit, repository}: RichFields): string => {
  const conditions = []
  if (types.length > 0) {
    const clause = types.map((t) => `type = "${t}"`).join(" | ")
    if (types.length === 1) conditions.push(clause)
    else conditions.push(`(${clause})`)
  }
  if (commit) {
    if (commit.length === 40) conditions.push(`commit = ${commit}`)
    else conditions.push(`commit ~ ^${commit}`) // commit startsWith
  }
  if (repository) conditions.push(`repository = ${repository}`)
  return conditions.join(" & ")
}

const defaultFields: RichFields = { types: [], commit: '', repository: '' }

const rawToRichFields = (query: string): RichFields => {
  const ast = parse(tokenize(query))
  if (ParseException.is(ast)) return defaultFields

  switch (ast.type) {
    case "or":
      return defaultFields // not supported in rich fields format
    case "and":
      const typesNode = ast.children.find((c) => (c.type === 'condition' && c.lhs === 'type' && c.operator === 'equal') || (c.type === 'or' && c.children.every((cc) => cc.type === 'condition' && cc.lhs === 'type' && cc.operator === 'equal'))) as ASTNodeCondition | ASTNodeOr | undefined
      const types = typesNode?.type === 'condition' ? [typesNode.rhs] : typesNode?.type === 'or' ? typesNode.children.map((c) => (c as ASTNodeCondition).rhs) : []
      const commitNode = ast.children.find((c) => c.type === 'condition' && c.lhs === 'commit') as ASTNodeCondition | undefined
      const commit = commitNode?.rhs.startsWith('^') ? commitNode?.rhs.substring(1) : commitNode?.rhs ?? ''
      const repositoryNode = ast.children.find((c) => c.type === 'condition' && c.lhs === 'repository' && c.operator === 'equal') as ASTNodeCondition | undefined
      const repository = repositoryNode?.rhs ?? ''
      return { types, commit, repository }
    case "condition":
      switch (ast.lhs) {
        case 'type':
          return { ...defaultFields, types: [ast.rhs] }
        case 'commit':
          return { ...defaultFields, commit: ast.rhs }
        case 'repository':
          return { ...defaultFields, repository: ast.rhs }
        default:
          return defaultFields
      }
  }
}

interface Props {
  className?: string
  query: string
  setQuery: (query: string) => void
  queryError: string
}

export const SearchFields: FunctionComponent<Props> = ({className, query, setQuery, queryError}) => {
  const [rawField, setRawField] = useState(query)

  const [types, setTypes] = useState<string[]>([])
  const [commit, setCommit] = useState('')
  const [repository, setRepository] = useState('')

  const updateFromRawField = () => {
    setQuery(rawField)
    // Sync rich fields
    const fields = rawToRichFields(rawField)
    setTypes(fields.types)
    setCommit(fields.commit)
    setRepository(fields.repository)
  }

  useEffect(() => {
    setRawField(query)
  }, [setRawField, query])

  const updateFromRichField = (t: string[] = types) => {
    setQuery(richFieldsToRaw({ types: t, commit, repository }))
    // Raw field is synced in parent component
  }

  return (
    <div className={`${className} flex flex-col gap-4`}>
      <TextField
        label="Query"
        variant="standard"
        InputLabelProps={{ shrink: true }}
        fullWidth
        value={rawField}
        onChange={(e) => setRawField(e.target.value)}
        error={queryError !== ''}
        helperText={queryError}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query !== rawField) {
            updateFromRawField()
          }
        }}
        onBlur={() => {
          if (query !== rawField) {
            updateFromRawField()
          }
        }}
      />
      <FormControl size="small">
        <div className="flex flex-row flex-wrap grid-cols-2 gap-4">
          <div className="flex flex-row gap-2">
            <div className="flex-none my-auto">Type =</div>
            <Select
              multiple
              value={types}
              renderValue={(s) => s.length === 1 ? s[0] : s.length === 0 ? '' : `${s.length} selected`}
              onChange={(e) => {
                const val = e.target.value
                const types = typeof val === 'string' ? val.split(",") : val
                setTypes(types)
                updateFromRichField(types)
              }}
            >
              {Object.values(RefactoringType).map((refType) => (
                <MenuItem key={refType} value={refType}>
                  <Checkbox checked={types.indexOf(refType) > -1} />
                  <ListItemText primary={refType} />
                </MenuItem>
              ))}
            </Select>
          </div>
          <SearchField name="Commit" value={commit} setValue={setCommit} update={updateFromRichField} />
          <SearchField name="Repository" value={repository} setValue={setRepository} update={updateFromRichField} />
        </div>
      </FormControl>
      <Divider flexItem />
      <div className="flex flex-row gap-4">
        <div className="text-md my-auto text-gray-600">Examples</div>
        <Button variant="outlined" onClick={() => setQuery(examples.useCase1)}>UseCase 1</Button>
        <Button variant="outlined" onClick={() => setQuery(examples.useCase2)}>UseCase 2</Button>
      </div>
      <Divider flexItem />
      {/* TODO */}
    </div>
  )
}
