import React, {FunctionComponent, useEffect, useRef, useState} from 'react';
import {TextField} from "@mui/material";
import {GetRefactoringsResponse, getRefactorings} from "../api/refactorings";
import {RefactoringCard} from "../components/RefactoringCard";
import {useSearchParams} from "react-router-dom";

export const Home: FunctionComponent = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryInput = useRef<HTMLInputElement>()

  const [showSearchResult, setShowSearchResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resp, setResp] = useState<GetRefactoringsResponse | undefined>()

  const refresh = () => {
    if (loading) {
      return
    }

    const query = queryInput.current?.value ?? ''

    setLoading(true)
    setSearchParams({ q: query })

    getRefactorings(query, 10, 0)
      .then((getResp) => {
        setLoading(false)

        if (getResp.status === 200) {
          setShowSearchResult(true)
          setResp(getResp.resp)
          setError('')
        } else {
          const resp = getResp.resp
          const message = resp.message === 'Malformed query' ? `${resp.message}: ${resp.details}` : resp.message
          setError(message)
        }
      })
  }

  useEffect(() => {
    if (searchParams.get('q')) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      {(error !== "" || loading || showSearchResult) &&
        <div className="my-12">
          {error !== "" ? `Error: ${error}` :
            loading ? "Loading..." :
              `${resp?.refactorings.length}${resp?.hasMore ? '+' : ''} results`}
        </div>
      }
      {showSearchResult &&
        <div className="mt-12">
          {resp?.refactorings.map((ref, i) => (
            <div key={i} className="my-6">
              <RefactoringCard refactoring={ref} />
            </div>
          ))}
        </div>
      }
    </div>
  );
}
