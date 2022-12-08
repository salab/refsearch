import {RMCodeElementType, RMRefactoringType} from "./consts.js";

export interface LeftSideLocation {
    filePath: string;
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
    codeElementType: RMCodeElementType;
    description: string;
    codeElement: string;
}

export interface RightSideLocation {
    filePath: string;
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
    codeElementType: RMCodeElementType;
    description: string;
    codeElement: string;
}

export interface Refactoring {
    type: RMRefactoringType;
    description: string;
    leftSideLocations: LeftSideLocation[];
    rightSideLocations: RightSideLocation[];
}

interface CommitInfo {
    repository: string;
    sha1: string;
    url: string;
}
export type RefactoringWithCommitInfo = Refactoring & CommitInfo

interface AdditionalInfo {
    extractedLines: number
    sourceMethodsCount: number
}
export type RefactoringWithAdditionalInfo = RefactoringWithCommitInfo & {
    additional: Partial<AdditionalInfo>
}

export interface Commit {
    repository: string;
    sha1: string;
    url: string;
    refactorings: Refactoring[];
}

export type CommitWithAdditionalInfo = Omit<Commit, 'refactorings'> & {
    refactorings: RefactoringWithAdditionalInfo[]
}

export interface RMOutput {
    commits: Commit[];
}
