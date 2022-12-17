import React, {FunctionComponent, useEffect, useState} from 'react';
import {CircularProgress, Pagination} from "@mui/material";
import {useGetRefactorings} from "../api/refactorings";
import {RefactoringCard} from "../components/RefactoringCard";
import {useSearchParams} from "react-router-dom";
import {SearchFields} from "../components/SearchFields";

const perPage = 10

const useParams = (): {
  params: {
    q: string
  }
  setSearchParams: ReturnType<typeof useSearchParams>[1]
} => {
  const [searchParams, setSearchParams] = useSearchParams()
  return {
    params: {
      q: searchParams.get('q') ?? '',
    },
    setSearchParams
  }
}

export const Home: FunctionComponent = () => {
  const { params, setSearchParams } = useParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState<number>(0)

  const { res, loading, error } = useGetRefactorings(query, perPage, page)

  useEffect(() => {
    if (query || params.q /* q was previously set */) {
      setSearchParams({ q: query })
    }
  }, [setSearchParams, params.q, query])

  useEffect(() => {
    setPage(0)
  }, [query])

  const resultText = ((): JSX.Element | undefined => {
    if (loading) {
      return <span className="text-gray-600">Loading...</span>
    } else if (res.refactorings) {
      return <span className="text-gray-900">{res.count}{res.hasMore ? '+' : ''} results</span>
    }
  })()

  return (
    <div className="p-12">
      <SearchFields query={query} setQuery={setQuery} queryError={error} />
      <div className="mt-12 flex flex-col gap-6">
        <div className="flex relative">
          <Pagination
            className="mx-auto"
            size="large"
            page={page+1}
            count={Math.ceil(res.count / perPage) + (res.hasMore ? 1 : 0)}
            onChange={(e, page) => setPage(page-1)}
          />
          {resultText && (
            <div className="absolute right-0 top-1/2 translate-y-[-50%] my-auto text-md">
              {resultText}
            </div>
          )}
        </div>
        {loading ? (
          <CircularProgress className="mx-auto" />
        ) : res.refactorings && res.refactorings.map((ref, i) => (
          <div key={i}>
            <RefactoringCard refactoring={ref}/>
          </div>
        ))}
      </div>
    </div>
  );
}
