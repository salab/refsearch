import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {TextField} from "@mui/material";
import {useGetRefactorings} from "../api/refactorings";
import {RefactoringCard} from "../components/RefactoringCard";
import {useSearchParams} from "react-router-dom";

export const Home: FunctionComponent = () => {
  const queryInput = useRef<HTMLInputElement>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState<string>(searchParams.get('q') ?? '')

  const { result, loading, error } = useGetRefactorings(query, 10, 0)

  const refresh = () => {
    setQuery(queryInput.current?.value ?? '')
  }

  useEffect(() => {
    if (query) {
      setSearchParams({q: query})
    }
  }, [setSearchParams, query])

  const topText = (() => {
    if (error !== '') {
      return `Error: ${error}`
    } else if (loading) {
      return 'Loading...'
    } else if (result) {
      return `${result.refactorings.length}${result.hasMore ? '+' : ''} results`
    }
  })()

  return (
    <div className="p-12">
      <TextField
        className="mb-12"
        label="Query"
        variant="standard"
        fullWidth
        defaultValue={searchParams.get('q')}
        inputRef={queryInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            refresh()
          }
        }}
        onBlur={refresh}
      />
      {topText &&
        <div className="my-12 text-lg text-gray-900">
          {topText}
        </div>
      }
      {result &&
        <div className="mt-12">
          {result.refactorings.map((ref, i) => (
            <div key={i} className="my-6">
              <RefactoringCard refactoring={ref} />
            </div>
          ))}
        </div>
      }
    </div>
  );
}
