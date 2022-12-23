import React, {FunctionComponent, useEffect, useState} from 'react';
import {CircularProgress, Pagination} from "@mui/material";
import {useGetRefactorings} from "../api/refactorings";
import {RefactoringCard} from "../components/RefactoringCard";
import {useSearchParams} from "react-router-dom";
import {SearchFields} from "../components/SearchFields";
import {formatDuration} from "../../../common/utils";

const perPage = 10

const useParams = (): {
  params: {
    q: string
    page: number
  }
  setSearchParams: ReturnType<typeof useSearchParams>[1]
} => {
  const [searchParams, setSearchParams] = useSearchParams()
  return {
    params: {
      q: searchParams.get('q') ?? '',
      page: (Number.parseInt(searchParams.get('page') ?? '1') || 1)-1,
    },
    setSearchParams
  }
}

export const Home: FunctionComponent = () => {
  const { params, setSearchParams } = useParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState<number>(params.page)

  const { res, loading, error, time } = useGetRefactorings(query, perPage, page)

  useEffect(() => {
    const nextParam: Record<string, string> = {}
    if (query || params.q /* q was previously set */) {
      nextParam.q = query
    }
    if (page || params.page /* page was previously set */) {
      nextParam.page = ''+(page+1)
    }
    if (Object.keys(nextParam).length > 0) {
      setSearchParams(nextParam)
    }
  }, [setSearchParams, params.q, query, params.page, page])

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
      <div className="my-auto text-md">
        TODO: Sort
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
