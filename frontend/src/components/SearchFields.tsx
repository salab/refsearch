import React, {FunctionComponent, useState} from "react";
import {Button, Checkbox, Divider, FormControl, ListItemText, MenuItem, Select, TextField} from "@mui/material";
import {RefactoringTypes} from "../../../common/common";
import {SearchField} from "./SearchField";

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
    if (commit.length === 40) conditions.push(`commit.hash = ${commit}`)
    else conditions.push(`sha1 ~ ^${commit}`) // commit startsWith
  }
  if (repository) conditions.push(`repository = ${repository}`)
  return conditions.join(" & ")
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

  const richFieldQuery = richFieldsToRaw({ types, commit, repository })

  const updateFromRawField = () => {
    setQuery(rawField)
  }

  const updateFromRichField = (t: string[] = types) => {
    setQuery(richFieldsToRaw({ types: t, commit, repository}))
    setRawField('')
  }

  const setFromExample = (q: string) => {
    setQuery(q)
    setRawField(q)
  }

  return (
    <div className={`${className} flex flex-col gap-4`}>
      <TextField
        label="Query"
        variant="standard"
        InputLabelProps={{ shrink: true }}
        placeholder={richFieldQuery}
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
          if (query !== rawField && rawField) {
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
              {Object.values(RefactoringTypes).map((refType) => (
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
        <Button variant="outlined" onClick={() => setFromExample(examples.useCase1)}>UseCase 1</Button>
        <Button variant="outlined" onClick={() => setFromExample(examples.useCase2)}>UseCase 2</Button>
      </div>
      <Divider flexItem />
      {/* TODO */}
    </div>
  )
}
