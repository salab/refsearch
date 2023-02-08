import equal from "fast-deep-equal/es6/index";
import {RefactoringMeta, RefactoringTypes} from "../../../../common/common";
import {
  CodeElementInfo,
  CodeElementsMap,
  ProcessedRMRefactoring,
  RMCommit,
  RMLeftSideLocation,
  RMOutput,
  RMRefactoring,
  RMRefactoringType
} from "../../../../common/rminer";
import {commitUrl, sshUrlToHttpsUrl} from "../../utils";
import {RefactoringWithoutCommit} from "./type";
import {rminerToolName} from "../runner/rminer";

type Refactoring = RefactoringWithoutCommit & ProcessedRMRefactoring
type Commit = Omit<RMCommit, 'refactorings'> & {
  refactorings: Refactoring[]
}

const extractedMethod = (r: Refactoring): CodeElementInfo | undefined => {
  const elt = r.after['extracted method declaration']
  if (!elt || Array.isArray(elt)) return undefined
  return elt
}

const extractedMethods = (c: Commit): CodeElementInfo[] => {
  return c.refactorings
    .filter((r) => r.type === RefactoringTypes.ExtractMethod)
    .map((r) => extractedMethod(r))
    .flatMap((rsl) => rsl ? [rsl] : [])
}

const extractSourceMethodsCount = (extractedMethods: CodeElementInfo[], r: Refactoring): number => {
  const method = extractedMethod(r)
  return extractedMethods.filter((m) => equal(m, method)).length
}

const extractMethodSourceMethodLines = (r: Refactoring): number => {
  const elt = r.before['source method declaration before extraction']
  if (!elt || Array.isArray(elt)) return -1
  return elt.lines
}
const extractMethodExtractedLines = (r: Refactoring): number => {
  const elt = r.after['extracted method declaration']
  if (!elt || Array.isArray(elt)) return -1
  return elt.lines
}

const extractRenameRe: Partial<Record<RMRefactoringType, RegExp>> = {
  'Rename Method': /^Rename Method (?:[^ ]+ )?(.+?)\(.*?\)(?: : .+?)? renamed to (?:[^ ]+ )?(.+?)\(.*?\)(?: : .+?)? in .+?$/,
  'Rename Class': /^Rename Class (?:.+?\.)*(.+?) renamed to (?:.+?\.)*(.+?)$/,
  'Rename Attribute': /^Rename Attribute (.+?) : .+? to (.+?) : .+? in .+?$/,
  'Rename Variable': /^Rename Variable (.+?) : .+? to (.+?) : .+? in .+?$/,
  'Rename Package': /^Rename Package (?:.+?\.)*(.+?) to (?:.+?\.)*(.+?)$/,
  'Rename Parameter': /^Rename Parameter (.+?) : .+? to (.+?) : .+? in .+?$/,
}
const extractRenameInfo = (r: RefactoringWithoutCommit): RefactoringMeta['rename'] | undefined => {
  const re = extractRenameRe[r.type as RMRefactoringType]
  if (re) {
    const match = re.exec(r.description)
    if (!match) {
      console.warn(`[reader > rminer] Regexp of type ${r.type} does not match the description ${r.description}`)
      return
    }
    return {
      from: match[1],
      to: match[2],
    }
  }
}

const codeElementLines = (e: RMLeftSideLocation): number => e.endLine - e.startLine + 1
const processCodeElements = (elements: RMLeftSideLocation[]): CodeElementsMap => {
  const ret: CodeElementsMap = {}
  elements.forEach((e) => {
    const next: CodeElementInfo & { description?: string } = { ...e, lines: codeElementLines(e) }
    delete next.description
    const key = e.description

    const prev = ret[key]
    if (prev) {
      if (Array.isArray(prev)) {
        prev.push(next)
      } else {
        ret[key] = [prev, next]
      }
    } else {
      ret[key] = next
    }
  })
  return ret
}
const process = (r: RMRefactoring): ProcessedRMRefactoring => ({
  before: processCodeElements(r.leftSideLocations),
  after: processCodeElements(r.rightSideLocations)
})

export const processRMinerOutput = (output: RMOutput): RefactoringWithoutCommit[] => {
  const commits = output.commits
    .map((c): Commit => {
      // Normalize to https url for convenience
      const url = sshUrlToHttpsUrl(c.url)
      const repository = sshUrlToHttpsUrl(c.repository)
      return {
        ...c,
        url,
        repository,
        refactorings: c.refactorings
          .map((r): Refactoring => ({
            type: r.type,
            description: r.description,

            sha1: c.sha1,
            repository,
            url: commitUrl(repository, c.sha1),

            meta: {
              tool: rminerToolName
            },

            ...process(r)
          }))
      }
    })

  // Pre-compute needed information
  commits.forEach((c) => {
    const methods = extractedMethods(c)
    c.refactorings
      .filter((r) => r.type === RefactoringTypes.ExtractMethod)
      .forEach((r) => {
        r.extractMethod = {
          // Use-case 1: 重複の処理が無い / あるextract
          sourceMethodsCount: extractSourceMethodsCount(methods, r),
          // Use-case 2: 数行のみのextract,  extractする前の行数
          sourceMethodLines: extractMethodSourceMethodLines(r),
          extractedLines: extractMethodExtractedLines(r)
        }
      })
    // Use-case 3: 具体的なrenameした単語
    c.refactorings
      .forEach((r) => {
        const rename = extractRenameInfo(r)
        if (rename) {
          r.rename = rename
        }
      })
  })


  return commits.flatMap((c) => c.refactorings)
}
