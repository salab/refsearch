import {useEffect, useState} from "react";
import {unreachable} from "../../../common/utils";

export interface SearchResponse<T> {
  total: {
    count: number
    hasMore: boolean
  }
  result: T[]
}
export type SearchResponseList<T> = {
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
    resp: await resp.json()
  }
}

export const useSearch = <T>(path: string, query: string, perPage: number, page: number, sort: string, order: 'asc' | 'desc'): {
  res: {
    result: T[] | undefined
    count: number
    hasMore: boolean
  }
  loading: boolean
  error: string
  time: number
} => {
  const [result, setResult] = useState<T[]>()
  const [count, setCount] = useState<number>(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState(0)

  useEffect(() => {
    setCount(0)
    setHasMore(true)
  }, [query, sort, order])

  useEffect(() => {
    const limit = perPage
    const offset = perPage * page

    setResult(undefined)
    setLoading(true)
    let cancelled = false

    const start = performance.now()
    search<T>(path, query, limit, offset, sort, order)
      .then((r) => {
        if (cancelled) {
          return
        }

        setLoading(false)
        setTime(performance.now() - start)
        if (r.status === 200) {
          setResult(r.resp.result)
          setCount((prev) => Math.max(prev, r.resp.total.count))
          setHasMore((prev) => prev && r.resp.total.hasMore)

          setError('')
        } else if (r.status === 400) {
          const resp = r.resp
          const message = resp.message === 'Malformed query' ? `${resp.message}: ${resp.details}` : resp.message
          setError(message)
        } else {
          unreachable(r)
        }
      })

    return () => { cancelled = true }
  }, [path, query, perPage, page, sort, order])

  return { res: { result, count, hasMore }, loading, error, time }
}

export type GetDocumentResponseList<T> = {
  status: 200,
  resp: T
} | {
  status: 400,
  resp: {
    message: 'Malformed id',
    details: string
  }
} | {
  status: 404,
  resp: {
    message: 'Document not found'
  }
}

export const getDocument = async <T>(basePath: string, id: string): Promise<GetDocumentResponseList<T>> => {
  const resp = await fetch(`${basePath}/${id}`)
  return {
    status: resp.status as GetDocumentResponseList<T>['status'],
    resp: await resp.json()
  }
}

export const useGetDocument = <T>(basePath: string, id: string): {
  result: T | undefined
  loading: boolean
  error: string
} => {
  const [result, setResult] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    let cancelled = false

    getDocument<T>(basePath, id)
      .then((r) => {
        if (cancelled) {
          return
        }

        setLoading(false)
        if (r.status === 200) {
          setResult(r.resp)
        } else if (r.status === 400) {
          setError('Malformed id')
        } else if (r.status === 404) {
          setError(`Refactoring with id ${id} not found`)
        } else {
          unreachable(r)
        }
      })

    return () => { cancelled = true }
  }, [basePath, id])

  return { result, loading, error }
}
