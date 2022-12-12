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
