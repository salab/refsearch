export enum RMRefactoringType {
  ExtractMethod = 'Extract Method',
}

export enum RMCodeElementType {
  MethodDeclaration = 'METHOD_DECLARATION',
}

export interface RMLeftSideLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  codeElementType: RMCodeElementType;
  description: string;
  codeElement: string;
}

export interface RMRightSideLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  codeElementType: RMCodeElementType;
  description: string;
  codeElement: string;
}

export interface RMRefactoring {
  type: RMRefactoringType;
  description: string;
  leftSideLocations: RMLeftSideLocation[];
  rightSideLocations: RMRightSideLocation[];
}

export interface RMCommit {
  repository: string;
  sha1: string;
  url: string;
  refactorings: RMRefactoring[];
}

export interface RMOutput {
  commits: RMCommit[];
}
