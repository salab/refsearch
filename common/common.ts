import {RMRefactoring, RMRefactoringType} from "./rminer";
import {RefDiffRefactoring} from "./refdiff";

export const RefactoringType = {
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

interface ExtractMethodInfo {
  extractedLines: number
  sourceMethodsCount: number
}

export type RefactoringMeta = {
  type: typeof RefactoringType[keyof typeof RefactoringType]
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
  }
}

export type Refactoring = { _id: string } & Omit<RefactoringMeta, 'sha1' | 'repository'> & { commit: Exclude<CommitMeta, '_id'> }

export interface CommitMeta {
  _id: string // hash
  hash: string
  date: Date
  message: string
  refs: string
  body: string
  author_name: string
  author_email: string
  url: string
  repository: string
  refactorings: { [key in keyof typeof RefactoringType]?: number }
}

export interface RepositoryMeta {
  _id: string // url
  url: string
}
