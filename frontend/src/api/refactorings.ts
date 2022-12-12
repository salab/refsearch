export interface GetRefactoringsResponse {
    hasMore: boolean
    refactorings: any[]
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
        status: resp.status as 200 | 400,
        resp: await resp.json()
    }
}
