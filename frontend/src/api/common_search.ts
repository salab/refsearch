import { useEffect, useState } from 'react'
import { unreachable } from '../../../common/utils.js'

interface SearchResponse<T> {
  total: {
    count: number
    hasMore: boolean
  }
  result: T[]
}

type SearchResponseList<T> = {
  status: 400,
  resp: {
    message: 'q parameter is required'
  }
} | {
  status: 400,
  resp: {
    message: 'Malformed query',
    details: string
  }
} | {
  status: 400,
  resp: {
    message: 'Invalid order',
    details: string
  }
} | {
  status: 200,
  resp: SearchResponse<T>
}

export const search = async <T>(path: string, query: string, limit: number, offset: number, sort: string, order: 'asc' | 'desc'): Promise<SearchResponseList<T>> => {
  const resp = await fetch(`${path}?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort=${sort}&order=${order}`)
  return {
    status: resp.status as SearchResponseList<T>['status'],
    resp: await resp.json(),
  }
}

export type SearchState<T> = {
  state: 'loading'
  error: ''
  time: 0
  query: string
  count: number
  hasMore: boolean
  res: undefined
} | {
  state: 'error'
  error: string
  time: number
  query: string
  count: number
  hasMore: boolean
  res: undefined
} | {
  state: 'success'
  error: ''
  time: number
  query: string
  count: number
  hasMore: boolean
  res: T[]
}

interface useSearchReturn<T> {
  state: SearchState<T>
  reload: () => void
}

export const useSearch = <T>(path: string, query: string, perPage: number, page: number, sort: string, order: 'asc' | 'desc'): useSearchReturn<T> => {
  const [state, setState] = useState<SearchState<T>>({
    state: 'loading',
    error: '',
    time: 0,
    query,
    count: 0,
    hasMore: true,
    res: undefined,
  })
  const [reloadDummyState, setReloadDummyState] = useState(0)

  useEffect(() => {
    const limit = perPage
    const offset = perPage * page

    setState((prev) => {
      // Reset count, hasMore on query change
      if (prev.query === query) {
        return { state: 'loading', error: '', time: 0, query, count: prev.count, hasMore: prev.hasMore, res: undefined }
      } else {
        return { state: 'loading', error: '', time: 0, query, count: 0, hasMore: true, res: undefined }
      }
    })
    let cancelled = false

    const start = performance.now()
    search<T>(path, query, limit, offset, sort, order)
      .then((r) => {
        if (cancelled) {
          return
        }

        const time = performance.now() - start
        if (r.status === 200) {
          setState((prev) => {
            const nextCount = Math.max(prev.count, r.resp.total.count)
            const nextHasMore = prev.hasMore && r.resp.total.hasMore
            return {
              state: 'success',
              error: '',
              time,
              query,
              count: nextCount,
              hasMore: nextHasMore,
              res: r.resp.result,
            }
          })
        } else if (r.status === 400) {
          const resp = r.resp
          const message = resp.message === 'Malformed query' ? `${resp.message}: ${resp.details}` : resp.message
          setState({ state: 'error', error: message, time: 0, query, count: 0, hasMore: true, res: undefined })
        } else {
          unreachable(r)
        }
      })

    return () => {
      cancelled = true
    }
  }, [path, query, perPage, page, sort, order, reloadDummyState])

  return { state, reload: () => setReloadDummyState(prev => prev + 1) }
}
