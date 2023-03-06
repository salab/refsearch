export interface ToolRawData {
  commit: string
  tool: string
  data: any
}

export interface ExportCommit {
  sha1: string
  tool: string
  refactorings: any[]
}

export type ExportFormat = ExportCommit[]
