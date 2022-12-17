import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {Pagination, TextField} from "@mui/material";
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
  const rawField = useRef<HTMLInputElement>()
  const { params, setSearchParams } = useParams()
  const [query, setQuery] = useState<string>(params.q)
  const [page, setPage] = useState<number>(0)

  const { res, loading, error } = useGetRefactorings(query, perPage, page)

  const setFromRawField = () => {
    setQuery(rawField.current?.value ?? '')
  }

  useEffect(() => {
    if (query) {
      setSearchParams({ q: query })
    }
  }, [setSearchParams, query])

  useEffect(() => {
    setPage(0)
  }, [query])

  const topText = ((): JSX.Element | undefined => {
    if (loading) {
      return <span className="text-gray-600">Loading...</span>
    } else if (res.refactorings) {
      return <span className="text-gray-900">{res.count}{res.hasMore ? '+' : ''} results</span>
    }
  })()

  return (
    <div className="p-12">
      <TextField
        className="mb-12"
        label="Query"
        variant="standard"
        fullWidth
        defaultValue={query}
        inputRef={rawField}
        error={error !== ''}
        helperText={error}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setFromRawField()
          }
        }}
        onBlur={setFromRawField}
      />
      <SearchFields className="mt-4" query={query} setQuery={(query) => {
        setQuery(query)
        if (rawField.current) {
          rawField.current.value = query
        }
      }} />
      {topText &&
        <div className="mt-8 mb-12 text-lg">
          {topText}
        </div>
      }
      {res.refactorings &&
        <div className="mt-12">
          <div className="flex">
            <Pagination
              className="mx-auto"
              size="large"
              page={page+1}
              count={Math.ceil(res.count / perPage) + (res.hasMore ? 1 : 0)}
              onChange={(e, page) => setPage(page-1)}
            />
          </div>
          <div>
            {res.refactorings.map((ref, i) => (
              <div key={i} className="my-6">
                <RefactoringCard refactoring={ref} />
              </div>
            ))}
          </div>
        </div>
      }
    </div>
  );
}
