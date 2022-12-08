import {CommitWithAdditionalInfo, RefactoringWithCommitInfo, RightSideLocation} from "./types.js";
import {RMCodeElementType, RMRefactoringType} from "./consts.js";
import equal from "fast-deep-equal/es6/index.js";

const extractedMethod = (r: RefactoringWithCommitInfo): RightSideLocation | undefined => {
    return r.rightSideLocations.find((rsl) =>
        rsl.codeElementType === RMCodeElementType.MethodDeclaration && rsl.description === 'extracted method declaration')
}

const extractedMethods = (c: CommitWithAdditionalInfo): RightSideLocation[] => {
    return c.refactorings
        .filter((r) => r.type === RMRefactoringType.ExtractMethod)
        .map((r) => extractedMethod(r))
        .flatMap((rsl) => rsl ? [rsl] : [])
}

export const extractSourceMethodsCount = (c: CommitWithAdditionalInfo): void => {
    const methods = extractedMethods(c)
    c.refactorings
        .filter((r) => r.type === RMRefactoringType.ExtractMethod)
        .forEach((r) => {
            const method = extractedMethod(r)
            r.additional.sourceMethodsCount = methods.filter((m) => equal(m, method)).length
        })
}

export const extractMethodExtractedLines = (r: RefactoringWithCommitInfo): number => {
    const extractedCode = r.leftSideLocations
        .find((lhs) => lhs.description === 'extracted code from source method declaration')
    if (!extractedCode) return -1
    return (extractedCode.endLine - extractedCode.startLine + 1)
}
