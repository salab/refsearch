import equal from "fast-deep-equal/es6/index.js";
import {Commit, Refactoring} from "../../types/types.js";
import {RMCodeElementType, RMRefactoringType, RMRightSideLocation} from "../../types/rminer.js";

const extractedMethod = (r: Refactoring): RMRightSideLocation | undefined => {
    return r.rightSideLocations.find((rsl) =>
        rsl.codeElementType === RMCodeElementType.MethodDeclaration && rsl.description === 'extracted method declaration')
}

const extractedMethods = (c: Commit): RMRightSideLocation[] => {
    return c.refactorings
        .filter((r) => r.type === RMRefactoringType.ExtractMethod)
        .map((r) => extractedMethod(r))
        .flatMap((rsl) => rsl ? [rsl] : [])
}

export const extractSourceMethodsCount = (c: Commit): void => {
    const methods = extractedMethods(c)
    c.refactorings
        .filter((r) => r.type === RMRefactoringType.ExtractMethod)
        .forEach((r) => {
            const method = extractedMethod(r)
            r.extractMethod.sourceMethodsCount = methods.filter((m) => equal(m, method)).length
        })
}

export const extractMethodExtractedLines = (r: Refactoring): number => {
    const extractedCode = r.leftSideLocations
        .find((lhs) => lhs.description === 'extracted code from source method declaration')
    if (!extractedCode) return -1
    return (extractedCode.endLine - extractedCode.startLine + 1)
}
