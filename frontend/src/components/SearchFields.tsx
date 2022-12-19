import React, {FunctionComponent, useEffect, useState} from "react";
import {Button, Checkbox, Divider, FormControl, ListItemText, MenuItem, Select, TextField} from "@mui/material";
import {RefactoringType} from "../../../common/common";
import {SearchField} from "./SearchField";

const examples = {
  // Use-case 1: 重複の処理が無いextract
  useCase1: 'type = "Extract Method" & extractMethod.sourceMethodsCount > 1',
  // Use-case 2: 数行のみのextract,  extractする前の行数
  useCase2: 'type = "Extract Method" & extractMethod.extractedLines >= 3'
  // TODO: Use-case 3: 具体的なrenameした単語
} as const

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
    // TODO: sync rich field
  }

  useEffect(() => {
    setRawField(query)
  }, [setRawField, query])

  const updateFromRichField = (t: string[] = types) => {
    const conditions = []
    if (t.length > 0) {
      const clause = t.map((t) => `type = "${t}"`).join(" | ")
      if (t.length === 1) conditions.push(clause)
      else conditions.push(`(${clause})`)
    }
    if (commit) conditions.push(`commit = ${commit}`)
    if (repository) conditions.push(`repository = ${repository}`)
    setQuery(conditions.join(" & "))
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
          if (e.key === "Enter") {
            updateFromRawField()
          }
        }}
        onBlur={updateFromRawField}
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
