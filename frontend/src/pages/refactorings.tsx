import React, {FunctionComponent, useState} from 'react';
import {
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  ListItemText,
  MenuItem,
  Select
} from "@mui/material";
import {RefactoringCard} from "../components/RefactoringCard";
import {useParsedSearchParams, useSearchParamsEffect} from "../libs/params";
import {useOrderButton} from "../components/OrderButton";
import {useSearchField} from "../components/SearchField";
import {RefactoringTypes} from "../../../common/common";
import {RoundButton} from "../components/RoundButton";
import {useGetRefactorings} from "../api/documents";
import {usePager} from "../components/Pager";

const examples: [query: string, tooltip: string][] = [
  // Use-case 1: 重複の処理が無いextract
  ['type = "Extract Method" & extractMethod.sourceMethodsCount >= 2', 'Removed duplicated code'],
  // Use-case 2: 数行のみのextract,  extractする前の行数
  ['type = "Extract Method" & extractMethod.sourceMethodLines >= 100', 'Extracted from method with 100+ lines'],
  ['type = "Extract Method" & "refactoringMiner.leftSideLocations.source method declaration before extraction.lines" >= 100', 'Same as example 2 (for RefactoringMiner)'],
  ['type = "Extract Method" & refDiff.before.location.lines >= 100', 'Same as example 2 (for RefDiff)'],
  ['type = "Extract Method" & extractMethod.extractedLines >= 10', 'Extracted 10+ lines'],
  ['type = "Extract Method" & "refactoringMiner.rightSideLocations.extracted method declaration.lines" >= 10', 'Same as example 5 (for RefactoringMiner)'],
  ['type = "Extract Method" & refDiff.after.location.lines >= 10', 'Same as example 5 (for RefDiff)'],
  // Use-case 3: 具体的なrenameした単語
  ['type ~ "^Rename" & rename.from ~ "^get" & rename.to ~ "^retrieve"', 'Renamed from get to retrieve'],
]

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

const SearchFields: FunctionComponent<Props> = ({className, query, setQuery, queryError}) => {
  const [types, setTypes] = useState<string[]>([])
  const { setValue: setCommit, internal: commit, field: commitField } = useSearchField({
    init: '', size: 'small', variant: 'outlined', update: (s) => updateFromRichField({ commit: s })
  })
  const { setValue: setRepository, internal: repository, field: repoField } = useSearchField({
    init: '', size: 'small', variant: 'outlined', update: (s) => updateFromRichField({ repository: s })
  })

  const richFieldQuery = richFieldsToRaw({ types, commit, repository })
  const { setValue: setRaw, field: rawField } = useSearchField({
    init: query,
    variant: 'standard',
    error: queryError,
    label: 'Query',
    shrink: true,
    placeholder: richFieldQuery,
    update: (s) => {
      setQuery(s)
      clearRichFields()
    },
  })

  const clearRichFields = () => {
    setTypes([])
    setCommit('')
    setRepository('')
  }

  const updateFromRichField = (f: Partial<RichFields>) => {
    setQuery(richFieldsToRaw({ types, commit, repository, ...f }))
    setRaw('')
  }

  const setFromExample = (q: string) => {
    setQuery(q)
    setRaw(q)
  }

  return (
    <div className={`${className} flex flex-col gap-4`}>
      {rawField}
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
                updateFromRichField({ types })
              }}
            >
              {Object.values(RefactoringTypes).sort().map((refType) => (
                <MenuItem key={refType} value={refType}>
                  <Checkbox checked={types.indexOf(refType) > -1} />
                  <ListItemText primary={refType} />
                </MenuItem>
              ))}
            </Select>
          </div>
          <div className="flex flex-row gap-2">
            <div className="flex-none my-auto">Commit =</div>
            {commitField}
          </div>
          <div className="flex flex-row gap-2">
            <div className="flex-none my-auto">Repository =</div>
            {repoField}
          </div>
        </div>
      </FormControl>
      <Divider flexItem />
      <div className="flex flex-row gap-4">
        <div className="text-md my-auto text-gray-600">Examples</div>
        {examples.map(([q, tooltip], i) => (
          <RoundButton key={i} onClick={() => setFromExample(q)} tooltip={tooltip}>{i+1}</RoundButton>
        ))}
      </div>
      <Divider flexItem />
    </div>
  )
}

const perPage = 10

export const Refactorings: FunctionComponent = () => {
  const { params, setSearchParams } = useParsedSearchParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState(params.page)
  const { value: sort, field: sortField } = useSearchField({
    init: params.sort, placeholder: 'commit.date', variant: 'standard', label: 'Sort Field', shrink: true
  })
  const { order, button: orderButton } = useOrderButton(params.order || 'desc')

  useSearchParamsEffect(params, setSearchParams, { query, page, sort, order }, 'commit.date', 'desc')

  const state = useGetRefactorings(query, perPage, page, sort, order)
  const { pager, resultText } = usePager(page, setPage, state, perPage)

  const pagerBar = (
    <div className="flex justify-between h-12">
      <div className="my-auto text-md flex flex-row gap-2 content-center">
        <div className="w-32">{sortField}</div>
        <div className="text-gray-600 my-auto">{orderButton}</div>
      </div>
      <div className="m-auto">{pager}</div>
      <div className="my-auto text-md text-right">{resultText}</div>
    </div>
  )

  return (
    <div>
      <SearchFields query={query} setQuery={(q) => {
        setQuery(q)
        setPage(0)
      }} queryError={state.error} />
      <div className="mt-12 flex flex-col gap-6">
        {pagerBar}
        {state.state === 'loading' ? (
          <CircularProgress className="mx-auto" />
        ) : state.state === 'success' ? state.res.map((ref, i) => (
          <div key={i}>
            <RefactoringCard refactoring={ref}/>
          </div>
        )) : <div>Error</div>}
        {pagerBar}
      </div>
    </div>
  );
}
