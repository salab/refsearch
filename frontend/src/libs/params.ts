import {useSearchParams} from "react-router-dom";

export const useParsedSearchParams = (): {
  params: {
    q: string
    page: number
    sort: string
    order: 'asc' | 'desc' | ''
  }
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
