import React, {FunctionComponent, useState} from 'react';
import {CircularProgress, Divider, FormControl} from "@mui/material";
import {useParsedSearchParams, useSearchParamsEffect} from "../libs/params";
import {useOrderButton} from "../components/OrderButton";
import {useSearchField} from "../components/SearchField";
import {RoundButton} from "../components/RoundButton";
import {useGetCommits} from "../api/documents";
import {usePager} from "../components/Pager";
import {CommitCard} from "../components/CommitCard";

const examples = [
  'message ~ [Rr]efactor',
  'refactorings.total >= 10',
  '"refactorings.perType.Rename Method" >= 10',
]

interface RichFields {
  hash: string
  repository: string
  message: string
}

const richFieldsToRaw = ({ hash, repository, message }: RichFields): string => {
  const conditions = []
  if (hash) {
    if (hash.length === 40) conditions.push(`_id = ${hash}`)
    else conditions.push(`_id ~ ^${hash}`) // commit startsWith
  }
  if (repository) conditions.push(`repository = ${repository}`)
  if (message) conditions.push(`message ~ ${message}`)
  return conditions.join(" & ")
}

interface Props {
  className?: string
  query: string
  setQuery: (query: string) => void
  queryError: string
}

const SearchFields: FunctionComponent<Props> = ({className, query, setQuery, queryError}) => {
  const { setValue: setHash, internal: hash, field: hashField } = useSearchField({
    init: '', size: 'small', variant: 'outlined', update: (s) => updateFromRichField({ hash: s })
  })
  const { setValue: setRepository, internal: repository, field: repoField } = useSearchField({
    init: '', size: 'small', variant: 'outlined', update: (s) => updateFromRichField({ repository: s })
  })
  const { setValue: setMessage, internal: message, field: messageField } = useSearchField({
    init: '', size: 'small', variant: 'outlined', update: (s) => updateFromRichField({ message: s })
  })

  const richFieldQuery = richFieldsToRaw({ hash, repository, message })
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
    setHash('')
    setRepository('')
    setMessage('')
  }

  const updateFromRichField = (f: Partial<RichFields>) => {
    setQuery(richFieldsToRaw({ hash, repository, message, ...f }))
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
            <div className="flex-none my-auto">Hash =</div>
            {hashField}
          </div>
          <div className="flex flex-row gap-2">
            <div className="flex-none my-auto">Repository =</div>
            {repoField}
          </div>
          <div className="flex flex-row gap-2">
            <div className="flex-none my-auto">Message =</div>
            {messageField}
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

export const Commits: FunctionComponent = () => {
  const { params, setSearchParams } = useParsedSearchParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState(params.page)
  const { value: sort, field: sortField } = useSearchField({
    init: params.sort, placeholder: 'date', variant: 'standard', label: 'Sort Field', shrink: true
  })
  const { order, button: orderButton } = useOrderButton(params.order || 'desc')

  useSearchParamsEffect(params, setSearchParams, { query, page, sort, order }, 'date')

  const state = useGetCommits(query, perPage, page, sort, order)
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
        ) : state.state === 'success' ? state.res.map((c, i) => (
          <div key={i}>
            <CommitCard commit={c}/>
          </div>
        )) : <div>Error</div>}
        {pagerBar}
      </div>
    </div>
  );
}
