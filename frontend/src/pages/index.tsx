import React, {FunctionComponent, useEffect, useState} from 'react';
import {
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  ListItemText,
  MenuItem,
  Pagination,
  Select
} from "@mui/material";
import {useGetRefactorings} from "../api/refactorings";
import {RefactoringCard} from "../components/RefactoringCard";
import {formatDuration} from "../../../common/utils";
import {useParsedSearchParams} from "../libs/params";
import {useOrderButton} from "../components/OrderButton";
import {useSearchField} from "../components/SearchField";
import {RefactoringTypes} from "../../../common/common";
import {RoundButton} from "../components/RoundButton";

const examples = [
  // Use-case 1: 重複の処理が無いextract
  'type = "Extract Method" & extractMethod.sourceMethodsCount > 1',
  // Use-case 2: 数行のみのextract,  extractする前の行数
  'type = "Extract Method" & extractMethod.extractedLines >= 3',
  // TODO: Use-case 3: 具体的なrenameした単語
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
  const { internal: commit, field: commitField } = useSearchField({ init: '', size: 'small', variant: 'outlined', update: () => updateFromRichField() })
  const { internal: repository, field: repoField } = useSearchField({ init: '', size: 'small', variant: 'outlined', update: () => updateFromRichField() })

  const richFieldQuery = richFieldsToRaw({ types, commit, repository })
  const { value: raw, setValue: setRaw, field: rawField } = useSearchField({
    init: query,
    variant: 'standard',
    error: queryError,
    label: 'Query',
    shrink: true,
    placeholder: richFieldQuery,
    update: () => setQuery(raw),
  })

  const updateFromRichField = (t: string[] = types) => {
    setQuery(richFieldsToRaw({ types: t, commit, repository}))
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
        {examples.map((ex, i) => (
          <RoundButton key={i} onClick={() => setFromExample(ex)}>{i+1}</RoundButton>
        ))}
      </div>
      <Divider flexItem />
    </div>
  )
}

const perPage = 10

export const Index: FunctionComponent = () => {
  const { params, setSearchParams } = useParsedSearchParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState<number>(params.page)
  const { value: sort, field: sortField } = useSearchField({ init: params.sort, placeholder: 'commit.date', variant: 'standard', label: 'Sort Field', shrink: true })
  const { order, button: orderButton } = useOrderButton(params.order || 'desc')

  const { res, loading, error, time } = useGetRefactorings(query, perPage, page, sort, order)

  useEffect(() => {
    const nextParam: Record<string, string> = {}
    if (query || params.q /* q was previously set */) {
      nextParam.q = query
    }
    if (page || params.page /* page was previously set */) {
      nextParam.page = ''+(page+1)
    }
    if (sort !== 'commit.date' || params.sort) {
      nextParam.sort = sort
    }
    if (order !== 'desc' || params.order) {
      nextParam.order = order
    }
    if (Object.keys(nextParam).length > 0) {
      setSearchParams(nextParam)
    }
  }, [setSearchParams, params.q, query, params.page, page, params.sort, sort, params.order, order])

  const resultText = ((): JSX.Element | undefined => {
    if (loading) {
      return <div className="text-gray-600">Loading...</div>
    } else if (res.refactorings) {
      return (
        <div className="text-right">
          <div className="text-gray-900">{res.count}{res.hasMore ? '+' : ''} results</div>
          <div className="text-gray-400">({formatDuration(time)})</div>
        </div>
      )
    }
  })()

  const pager = (
    <div className="flex justify-between h-12">
      <div className="my-auto text-md flex flex-row gap-2 content-center">
        <div className="w-32">{sortField}</div>
        <div className="text-gray-600 my-auto">{orderButton}</div>
      </div>
      <Pagination
        className="m-auto"
        size="large"
        page={page+1}
        count={Math.ceil(res.count / perPage) + (res.hasMore ? 1 : 0)}
        onChange={(e, page) => setPage(page-1)}
      />
      {resultText && (
        <div className="my-auto text-md">
          {resultText}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-12">
      <SearchFields query={query} setQuery={(q) => {
        setQuery(q)
        setPage(0)
      }} queryError={error} />
      <div className="mt-12 flex flex-col gap-6">
        {pager}
        {loading ? (
          <CircularProgress className="mx-auto" />
        ) : res.refactorings && res.refactorings.map((ref, i) => (
          <div key={i}>
            <RefactoringCard refactoring={ref}/>
          </div>
        ))}
        {pager}
      </div>
    </div>
  );
}
