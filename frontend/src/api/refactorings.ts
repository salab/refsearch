import {Refactoring} from "../../../common/common";
import {useEffect, useState} from "react";
import {unreachable} from "../../../common/utils";

export type RefactoringWithId = Refactoring & { _id: string }

export interface GetRefactoringsResponse {
  total: {
    count: number
    hasMore: boolean
  }
  refactorings: RefactoringWithId[]
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
  status: 200,
  resp: GetRefactoringsResponse
}

export const getRefactorings = async (query: string, limit: number, offset: number): Promise<GetRefactoringsResponseList> => {
  const resp = await fetch(`/api/refactorings?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`)
  return {
    status: resp.status as GetRefactoringsResponseList['status'],
    resp: await resp.json()
  }
}

export const useGetRefactorings = (query: string, perPage: number, page: number): {
  res: {
    refactorings: RefactoringWithId[] | undefined
    count: number
    hasMore: boolean
  }
  loading: boolean
  error: string
} => {
  const [refactorings, setRefactorings] = useState<RefactoringWithId[]>()
  const [count, setCount] = useState<number>(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCount(0)
    setHasMore(true)
  }, [query])

  useEffect(() => {
    const limit = perPage
    const offset = perPage * page

    setRefactorings(undefined)
    setLoading(true)
    let cancelled = false

    getRefactorings(query, limit, offset)
      .then((r) => {
        if (cancelled) {
          return
        }

        setLoading(false)
        if (r.status === 200) {
          setRefactorings(r.resp.refactorings)
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
  }, [query, perPage, page])

  return { res: { refactorings, count, hasMore }, loading, error }
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
    message: 'Refactoring with given id not found'
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
