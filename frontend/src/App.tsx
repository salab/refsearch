import React, {useRef, useState} from 'react';
import {TextField} from "@mui/material";
import {GetRefactoringsResponse, getRefactorings} from "./api/refactorings";
import "highlight.js/styles/github-dark-dimmed.css";
import Highlight from "./components/Highlight"

function App() {
  const queryInput = useRef<HTMLInputElement>()

  const [showSearchResult, setShowSearchResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resp, setResp] = useState<GetRefactoringsResponse | undefined>()

  const refresh = () => {
    if (loading) {
      return
    }
    setLoading(true)
    getRefactorings(queryInput.current?.value ?? '', 10, 0)
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

  return (
    <div className="p-12">
      <TextField
        className="mb-12"
        label="Query"
        variant="standard"
        fullWidth
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
            <Highlight className="language-json my-6 max-h-80 rounded-md border-2 border-green-900 invisible-scrollbar" key={i}>
              {JSON.stringify(ref, null, 2)}
            </Highlight>
          ))}
        </div>
      }
    </div>
  );
}

export default App;
