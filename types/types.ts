import {RMCommit, RMRefactoring} from "./rminer";

interface CommitInfo {
    repository: string;
    sha1: string;
    url: string;
}
interface ExtractMethodInfo {
    extractedLines: number
    sourceMethodsCount: number
}
export type Refactoring = RMRefactoring & CommitInfo & {
    extractMethod: Partial<ExtractMethodInfo>
}

export type Commit = Omit<RMCommit, 'refactorings'> & {
    refactorings: Refactoring[]
}

export interface CommitMeta {
    _id: string // hash
    hash: string
    date: string
    message: string
    refs: string
    body: string
    author_name: string
    author_email: string
    repoUrl: string
}

export interface RepositoryMeta {
    _id: string // url
    url: string
}
