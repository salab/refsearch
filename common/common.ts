import { ProcessedRMRefactoring, RMRefactoringTypes } from './rminer.js'
import { ProcessedRefDiffRefactoring } from './refdiff.js'

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

export const commitPlaceholder = (): RefactoringMeta['commit'] => ({
  sha1: '',
  date: new Date(),
  message: '',
  refs: '',
  body: '',
  authorName: '',
  authorEmail: '',
  url: '',
  size: { files: { changed: 0 }, lines: { inserted: 0, deleted: 0 } },
  refactorings: { total: 0, perTool: {}, perType: {} },
  tools: {},
})

type OptionalRefactoringMeta = ProcessedRMRefactoring | ProcessedRefDiffRefactoring
export type PureRefactoringMeta = {
  type: RefactoringType
  description: string

  extractMethod?: ExtractMethodInfo
  rename?: RenameInfo
} & Partial<OptionalRefactoringMeta>
export type RefactoringMeta = PureRefactoringMeta & {
  sha1: string
  repository: string
  url: string

  meta: {
    tool?: string
  }

  commit: Omit<CommitMeta, '_id' | 'repository'> // Merged from commits collection on insert
}

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
  perType: Partial<Record<RefactoringType, number>>
  perTool: Partial<Record<string, number>>
}

export enum CommitProcessState {
  OK = 'ok',
  NG = 'ng',
}

export interface CommitMeta {
  _id: string // same as sha1

  sha1: string
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
  tools: Record<string, CommitProcessState>
}

export interface RepositoryMeta {
  _id: string // url

  commits: number
  refactorings: RefactoringsCount
}
