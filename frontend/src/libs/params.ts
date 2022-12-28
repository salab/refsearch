import {useSearchParams} from "react-router-dom";
import {useEffect} from "react";

export interface ParsedSearchParams {
  q: string
  page: number
  sort: string
  order: 'asc' | 'desc' | ''
}

export const useParsedSearchParams = (): {
  params: ParsedSearchParams
  setSearchParams: ReturnType<typeof useSearchParams>[1]
} => {
  const [searchParams, setSearchParams] = useSearchParams()
  return {
    params: {
      q: searchParams.get('q') ?? '',
      page: (Number.parseInt(searchParams.get('page') ?? '1') || 1)-1,
      sort: searchParams.get('sort') ?? '',
      order: (searchParams.get('order') ?? '') as 'asc' | 'desc' | '',
    },
    setSearchParams
  }
}

export interface CurrentState {
  query: string
  page: number
  sort: string
  order: 'asc' | 'desc'
}

export const useSearchParamsEffect = (
  params: ParsedSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  current: CurrentState,
  defaultSort: string,
  defaultOrder: 'asc' | 'desc',
) => {
  const { query, page, sort, order } = current
  useEffect(() => {
    const nextParam: Record<string, string> = {}
    if (query || params.q /* q was previously set */) {
      nextParam.q = query
    }
    if (page || params.page /* page was previously set */) {
      nextParam.page = ''+(page+1)
    }
    if (sort !== defaultSort || params.sort) {
      nextParam.sort = sort
    }
    if (order !== defaultOrder || params.order) {
      nextParam.order = order
    }
    if (Object.keys(nextParam).length > 0) {
      setSearchParams(nextParam)
    }
  }, [
    setSearchParams, defaultSort, defaultOrder,
    params.q, params.page, params.sort, params.order,
    query, page, sort, order,
  ])
}
