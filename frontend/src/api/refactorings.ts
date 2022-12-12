import {Refactoring} from "../../../types/types";

export type RefactoringWithId = Refactoring & { _id: string }

export interface GetRefactoringsResponse {
    hasMore: boolean
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
