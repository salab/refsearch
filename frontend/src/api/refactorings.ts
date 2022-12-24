import {RefactoringWithId} from "../../../common/common";
import {useEffect, useState} from "react";
import {unreachable} from "../../../common/utils";

export interface GetRefactoringsResponse {
  total: {
    count: number
    hasMore: boolean
  }
  result: RefactoringWithId[]
}
export type GetRefactoringsResponseList = {
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
  resp: GetRefactoringsResponse
}

export const getRefactorings = async (query: string, limit: number, offset: number, sort: string, order: 'asc' | 'desc'): Promise<GetRefactoringsResponseList> => {
  const resp = await fetch(`/api/refactorings?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort=${sort}&order=${order}`)
  return {
    status: resp.status as GetRefactoringsResponseList['status'],
    resp: await resp.json()
  }
}

export const useGetRefactorings = (query: string, perPage: number, page: number, sort: string, order: 'asc' | 'desc'): {
  res: {
    refactorings: RefactoringWithId[] | undefined
    count: number
    hasMore: boolean
  }
  loading: boolean
  error: string
  time: number
} => {
  const [refactorings, setRefactorings] = useState<RefactoringWithId[]>()
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

    setRefactorings(undefined)
    setLoading(true)
    let cancelled = false

    const start = performance.now()
    getRefactorings(query, limit, offset, sort, order)
      .then((r) => {
        if (cancelled) {
          return
        }

        setLoading(false)
        setTime(performance.now() - start)
        if (r.status === 200) {
          setRefactorings(r.resp.result)
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
  }, [query, perPage, page, sort, order])

  return { res: { refactorings, count, hasMore }, loading, error, time }
}

export type GetRefactoringResponseList = {
  status: 200,
  resp: RefactoringWithId
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

export const getRefactoring = async (id: string): Promise<GetRefactoringResponseList> => {
  const resp = await fetch(`/api/refactorings/${id}`)
  return {
    status: resp.status as GetRefactoringResponseList['status'],
    resp: await resp.json()
  }
}

export const useGetRefactoring = (id: string): {
  result: RefactoringWithId | undefined
  loading: boolean
  error: string
} => {
  const [result, setResult] = useState<RefactoringWithId>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    let cancelled = false

    getRefactoring(id)
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
  }, [id])

  return { result, loading, error }
}
