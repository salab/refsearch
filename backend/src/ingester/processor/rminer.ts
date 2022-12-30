import equal from "fast-deep-equal/es6/index";
import {rminerVersion} from "../info";
import {RefactoringMeta, RefactoringTypes} from "../../../../common/common";
import {
  RMCodeElementType,
  RMCommit,
  RMOutput,
  RMRefactoringType,
  RMRightSideLocation
} from "../../../../common/rminer";
import {sshUrlToHttpsUrl} from "../../utils";
import {RefactoringWithoutCommit} from "./type";

type Commit = Omit<RMCommit, 'refactorings'> & {
  refactorings: RefactoringWithoutCommit[]
}

const extractedMethod = (r: RefactoringWithoutCommit): RMRightSideLocation | undefined => {
  return r.raw.refactoringMiner?.rightSideLocations.find((rsl) =>
    rsl.codeElementType === RMCodeElementType.MethodDeclaration && rsl.description === 'extracted method declaration')
}

const extractedMethods = (c: Commit): RMRightSideLocation[] => {
  return c.refactorings
    .filter((r) => r.type === RefactoringTypes.ExtractMethod)
    .map((r) => extractedMethod(r))
    .flatMap((rsl) => rsl ? [rsl] : [])
}

const extractSourceMethodsCount = (extractedMethods: RMRightSideLocation[], r: RefactoringWithoutCommit): number => {
  const method = extractedMethod(r)
  return extractedMethods.filter((m) => equal(m, method)).length
}

const extractMethodExtractedLines = (r: RefactoringWithoutCommit): number => {
  const extractedCode = r.raw.refactoringMiner?.rightSideLocations
    .find((rhs) => rhs.description === 'extracted method declaration')
  if (!extractedCode) return -1
  return (extractedCode.endLine - extractedCode.startLine + 1)
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
          .map((r): RefactoringWithoutCommit => ({
            type: r.type,
            description: r.description,
            sha1: c.sha1,
            repository,
            raw: {
              refactoringMiner: r
            },
            meta: {
              tool: `RefactoringMiner ${rminerVersion}`
            }
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
