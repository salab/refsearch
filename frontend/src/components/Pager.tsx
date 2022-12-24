import {formatDuration, unreachable} from "../../../common/utils";
import React from "react";
import {Pagination} from "@mui/material";
import {SearchState} from "../api/common_search";

export const usePager = (page: number, setPage: (p: number) => void, state: SearchState<any>, perPage: number): {
  pager: JSX.Element
  resultText: JSX.Element
} => {
  const resultText = ((): JSX.Element => {
    if (state.state === 'loading') {
      return <div className="text-gray-600">Loading...</div>
    } else if (state.state === 'success') {
      return (
        <>
          <div className="text-gray-900">{state.count}{state.hasMore ? '+' : ''} results</div>
          <div className="text-gray-400">({formatDuration(state.time)})</div>
        </>
      )
    } else if (state.state === 'error') {
      return (
        <div className="text-gray-400">Error</div>
      )
    }
    return unreachable(state)
  })()

  const pageCount = state.state === 'success'
    ? Math.ceil(state.count / perPage) + (state.hasMore ? 1 : 0)
    : 1
  const pager = (
    <Pagination
      size="large"
      page={page+1}
      count={pageCount}
      onChange={(e, page) => setPage(page-1)}
    />
  )

  return { pager, resultText }
}
