import {RMRefactoring, RMRefactoringType} from "./rminer";
import {RefDiffRefactoring} from "./refdiff";

export const RefactoringTypes = {
  ...RMRefactoringType,
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

interface ExtractMethodInfo {
  extractedLines: number
  sourceMethodsCount: number
}

export type RefactoringMeta = {
  type: RefactoringType
  sha1: string
  repository: string
  description: string
  extractMethod?: ExtractMethodInfo
  raw: {
    refactoringMiner?: RMRefactoring
    refDiff?: RefDiffRefactoring
  },
  meta: {
    tool?: string
  },
  commit: Omit<CommitMeta, '_id' | 'hash' | 'repository'>, // Merged from commits collection on insert
}

export type RefactoringWithId = { _id: string } & RefactoringMeta

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
  refactorings: { [key in RefactoringType]?: number }
}

export interface RepositoryMeta {
  _id: string // url
  refactorings: { [key in RefactoringType]?: number }
}
