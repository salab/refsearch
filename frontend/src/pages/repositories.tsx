import React, {FunctionComponent, useState} from "react";
import {useGetRepositories} from "../api/documents";
import {usePager} from "../components/Pager";
import {CircularProgress, Divider, FormControl} from "@mui/material";
import {useParsedSearchParams, useSearchParamsEffect} from "../libs/params";
import {useSearchField} from "../components/SearchField";
import {useOrderButton} from "../components/OrderButton";
import {RepositoryCard} from "../components/RepositoryCard";

interface RichFields {
  url: string
}

const richFieldsToRaw = ({ url }: RichFields): string => {
  const conditions = []
  if (url) conditions.push(`_id ~ ${url}`)
  return conditions.join(" & ")
}

interface Props {
  className?: string
  query: string
  setQuery: (query: string) => void
  queryError: string
}

const SearchFields: FunctionComponent<Props> = ({className, query, setQuery, queryError}) => {
  const { setValue: setURL, internal: url, field: urlField } = useSearchField({
    init: '', size: 'small', variant: 'outlined', update: (s) => updateFromRichField({ url: s })
  })

  const richFieldQuery = richFieldsToRaw({ url })
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
    setURL('')
  }

  const updateFromRichField = (f: Partial<RichFields>) => {
    setQuery(richFieldsToRaw({ url, ...f }))
    setRaw('')
  }

  return (
    <div className={`${className} flex flex-col gap-4`}>
      {rawField}
      <FormControl size="small">
        <div className="flex flex-row flex-wrap grid-cols-2 gap-4">
          <div className="flex flex-row gap-2">
            <div className="flex-none my-auto">URL =</div>
            {urlField}
          </div>
        </div>
      </FormControl>
      <Divider flexItem />
    </div>
  )
}

const perPage = 10

export const Repositories: FunctionComponent = () => {
  const { params, setSearchParams } = useParsedSearchParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState(params.page)
  const { value: sort, field: sortField } = useSearchField({
    init: params.sort, placeholder: '_id', variant: 'standard', label: 'Sort Field', shrink: true
  })
  const { order, button: orderButton } = useOrderButton(params.order || 'desc')

  useSearchParamsEffect(params, setSearchParams, { query, page, sort, order }, 'date')

  const state = useGetRepositories(query, perPage, page, sort, order)
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
        ) : state.state === 'success' ? state.res.map((r, i) => (
          <div key={i}>
            <RepositoryCard repository={r}/>
          </div>
        )) : <div>Error</div>}
        {pagerBar}
      </div>
    </div>
  );
}
