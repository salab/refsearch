import equal from "fast-deep-equal/es6/index";
import {rminerVersion} from "../../info";
import {RefactoringMeta, RefactoringType} from "../../../../common/common";
import {RMCodeElementType, RMCommit, RMOutput, RMRightSideLocation} from "../../../../common/rminer";
import {sshUrlToHttpsUrl} from "../../utils";

type Commit = Omit<RMCommit, 'refactorings'> & {
  refactorings: RefactoringMeta[]
}

const extractedMethod = (r: RefactoringMeta): RMRightSideLocation | undefined => {
  return r.raw.refactoringMiner?.rightSideLocations.find((rsl) =>
    rsl.codeElementType === RMCodeElementType.MethodDeclaration && rsl.description === 'extracted method declaration')
}

const extractedMethods = (c: Commit): RMRightSideLocation[] => {
  return c.refactorings
    .filter((r) => r.type === RefactoringType.ExtractMethod)
    .map((r) => extractedMethod(r))
    .flatMap((rsl) => rsl ? [rsl] : [])
}

const extractSourceMethodsCount = (extractedMethods: RMRightSideLocation[], r: RefactoringMeta): number => {
  const method = extractedMethod(r)
  return extractedMethods.filter((m) => equal(m, method)).length
}

const extractMethodExtractedLines = (r: RefactoringMeta): number => {
  const extractedCode = r.raw.refactoringMiner?.rightSideLocations
    .find((rhs) => rhs.description === 'extracted method declaration')
  if (!extractedCode) return -1
  return (extractedCode.endLine - extractedCode.startLine + 1)
}

export const processRMinerOutput = (output: RMOutput): RefactoringMeta[] => {
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
          .map((r): RefactoringMeta => ({
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
      .filter((r) => r.type === RefactoringType.ExtractMethod)
      .forEach((r) => {
        r.extractMethod = {
          // Use-case 1: 重複の処理が無い / あるextract
          sourceMethodsCount: extractSourceMethodsCount(methods, r),
          // Use-case 2: 数行のみのextract,  extractする前の行数
          extractedLines: extractMethodExtractedLines(r)
        }
      })
  })


  return commits.flatMap((c) => c.refactorings)
}
