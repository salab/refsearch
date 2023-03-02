import { useEffect, useState } from 'react'
import { unreachable } from '../../../common/utils.js'

type GetDocumentResponseList<T> = {
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
  const resp = await fetch(`${basePath}/${encodeURIComponent(id)}`)
  return {
    status: resp.status as GetDocumentResponseList<T>['status'],
    resp: await resp.json(),
  }
}

export type FetchState<T> = {
  state: 'loading'
  error: ''
  time: 0
  res: undefined
} | {
  state: 'error'
  error: string
  time: number
  res: undefined
} | {
  state: 'success'
  error: ''
  time: number
  res: T
}

const loadingState = { state: 'loading', error: '', time: 0, res: undefined } as const

export const useGetDocument = <T>(basePath: string, id: string): FetchState<T> => {
  const [state, setState] = useState<FetchState<T>>(loadingState)

  useEffect(() => {
    setState(loadingState)
    const start = performance.now()
    let cancelled = false

    getDocument<T>(basePath, id)
      .then((r) => {
        if (cancelled) {
          return
        }

        const time = performance.now() - start
        if (r.status === 200) {
          setState({ state: 'success', error: '', time, res: r.resp })
        } else if (r.status === 400) {
          setState({ state: 'error', error: 'Malformed id', time, res: undefined })
        } else if (r.status === 404) {
          setState({ state: 'error', error: `Document with id ${id} not found`, time, res: undefined })
        } else {
          unreachable(r)
        }
      })

    return () => {
      cancelled = true
    }
  }, [basePath, id])

  return state
}
