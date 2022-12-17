import React, {FunctionComponent, useEffect, useState} from "react";
import {Button, Divider, FormControl, MenuItem, Select, TextField} from "@mui/material";
import {RefactoringType} from "../../../common/common";

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
  const [type, setType] = useState('')

  const updateFromRawField = () => {
    setQuery(rawField)
    // TODO: sync rich field
  }

  useEffect(() => {
    setRawField(query)
  }, [setRawField, query])

  useEffect(() => {
    const conditions = []
    if (type) {
      conditions.push(`type = "${type}"`)
    }
    setQuery(conditions.join(" & "))
  }, [setQuery, type])

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
        <div className="flex flex-row grid-cols-2 gap-4">
          <div className="flex-none my-auto">Type =</div>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <MenuItem value=""><em>None</em></MenuItem>
            {Object.values(RefactoringType).map((refType) => <MenuItem value={refType}>{refType}</MenuItem>)}
          </Select>
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
