import {CommitMeta, RefactoringWithId} from "../../../common/common";
import {useSearch} from "./common_search";
import {useGetDocument} from "./common_fetch";

export const useGetRefactorings = (query: string, perPage: number, page: number, sort: string, order: 'asc' | 'desc') =>
  useSearch<RefactoringWithId>('/api/refactorings', query, perPage, page, sort, order)
export const useGetRefactoring = (id: string) =>
  useGetDocument<RefactoringWithId>('/api/refactorings', id)
export const useGetCommits = (query: string, perPage: number, page: number, sort: string, order: 'asc' | 'desc') =>
  useSearch<CommitMeta>('/api/commits', query, perPage, page, sort, order)
export const useGetCommit = (hash: string) =>
  useGetDocument<CommitMeta>('/api/commits', hash)
export const useGetRepositories = (query: string, perPage: number, page: number, sort: string, order: 'asc' | 'desc') =>
  useSearch<CommitMeta>('/api/repositories', query, perPage, page, sort, order)
export const useGetRepository = (url: string) =>
  useGetDocument<CommitMeta>('/api/repositories', url)
