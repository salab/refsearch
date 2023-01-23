import {ProcessedRMRefactoring, RMRefactoringTypes} from "./rminer";
import {ProcessedRefDiffRefactoring} from "./refdiff";

export const RefactoringTypes = {
  ...RMRefactoringTypes,
  ConvertType: 'Convert Type',
  ChangeSignature: 'Change Signature',
  PullUpSignature: 'Pull Up Signature',
  PushDownImpl: 'Push Down Impl',
  RenameInterface: 'Rename Interface',
  RenameEnum: 'Rename Enum',
  MoveInterface: 'Move Interface',
  MoveEnum: 'Move Enum',
  MoveAndRenameInterface: 'Move and Rename Interface',
  MoveAndRenameEnum: 'Move and Rename Enum',
  ExtractEnum: 'Extract Enum',
  ExtractAndMoveClass: 'Extract and Move Class',
  ExtractAndMoveInterface: 'Extract and Move Interface',
  ExtractAndMoveEnum: 'Extract and Move Enum',
} as const
export type RefactoringType = typeof RefactoringTypes[keyof typeof RefactoringTypes]

export interface ExtractMethodInfo {
  sourceMethodLines: number
  extractedLines: number
  sourceMethodsCount: number
}
export interface RenameInfo {
  from: string
  to: string
}

type OptionalRefactoringMeta = ProcessedRMRefactoring | ProcessedRefDiffRefactoring
export type RefactoringMeta = {
  type: RefactoringType
  description: string

  sha1: string
  repository: string
  url: string

  extractMethod?: ExtractMethodInfo
  rename?: RenameInfo

  meta: {
    tool?: string
  }
  commit: Omit<CommitMeta, '_id' | 'hash' | 'repository'> // Merged from commits collection on insert
} & Partial<OptionalRefactoringMeta>

export type RefactoringWithId = { _id: string } & RefactoringMeta

export interface CommitSizeInfo {
  files: {
    changed: number
  }
  lines: {
    inserted: number
    deleted: number
  }
}

export interface RefactoringsCount {
  total: number
  perType: Record<RefactoringType, number>
  perTool: Record<string, number>
}

export interface CommitMeta {
  _id: string // hash
  date: Date
  message: string
  refs: string
  body: string
  authorName: string
  authorEmail: string
  url: string
  repository: string
  size: CommitSizeInfo
  refactorings: RefactoringsCount
}

export interface RepositoryMeta {
  _id: string // url
  refactorings: RefactoringsCount
  indexedUntil: string
}
