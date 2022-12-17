import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {TextField} from "@mui/material";
import {useGetRefactorings} from "../api/refactorings";
import {RefactoringCard} from "../components/RefactoringCard";
import {useSearchParams} from "react-router-dom";
import {SearchFields} from "../components/SearchFields";

export const Home: FunctionComponent = () => {
  const rawField = useRef<HTMLInputElement>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState<string>(searchParams.get('q') ?? '')

  const { result, loading, error } = useGetRefactorings(query, 10, 0)

  const setFromRawField = () => {
    setQuery(rawField.current?.value ?? '')
  }

  useEffect(() => {
    if (query) {
      setSearchParams({q: query})
    }
  }, [setSearchParams, query])

  const topText = ((): JSX.Element | undefined => {
    if (loading) {
      return <span className="text-gray-600">Loading...</span>
    } else if (result) {
      return <span className="text-gray-900">{result.refactorings.length}{result.hasMore ? '+' : ''} results</span>
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
