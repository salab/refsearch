import {
  RefDiffCommit,
  RefDiffOutput,
  RefDiffRefactoring
} from "../../../types/refdiff";
import {Refactoring, RefactoringType} from "../../../types/types";
import {refDiffVersion} from "../info";
import equal from "fast-deep-equal/es6";

const formatTypeAndDescription = (ref: RefDiffRefactoring): [typ: Refactoring["type"], desc: string] => {
  switch (ref.type) {
    case "CONVERT_TYPE":
      return ["Convert Type", `Converted type of ${ref.after.name} from ${ref.before.type.toLowerCase()} to ${ref.after.type.toLowerCase()} in ${ref.after.location.file}`]
    case "CHANGE_SIGNATURE":
      return ["Change Signature", `Changed ${ref.after.type.toLowerCase()} signature from ${ref.before.name} to ${ref.after.name} in ${ref.after.location.file}`]
    case "PULL_UP":
      if (ref.after.type === "Method") {
        return ["Pull Up Method", `Pulled up method ${ref.after.name} from ${ref.before.location.file} to ${ref.after.location.file}`]
      } else {
        return ["Pull Up Attribute", `Pulled up ${ref.after.type.toLowerCase()} ${ref.after.name} from ${ref.before.location.file} to ${ref.after.location.file}`]
      }
    case "PUSH_DOWN":
      if (ref.after.type === "Method") {
        return ["Push Down Method", `Pushed down method ${ref.after.name} from ${ref.before.location.file} to ${ref.after.location.file}`]
      } else {
        return ["Push Down Attribute", `Pushed down ${ref.after.type.toLowerCase()} ${ref.after.name} from ${ref.before.location.file} to ${ref.after.location.file}`]
      }
    case "PULL_UP_SIGNATURE":
      return ["Pull Up Signature", `Pulled up ${ref.after.type.toLowerCase()} signature from ${ref.before.location.file} to ${ref.after.location.file}`]
    case "PUSH_DOWN_IMPL":
      return ["Push Down Impl", `Pushed down implementation ${ref.after.name} rom ${ref.before.location.file} to ${ref.after.location.file}`]
    case "RENAME":
      return [`Rename ${ref.after.type}`, `Renamed ${ref.after.type.toLowerCase()} from ${ref.before.name} to ${ref.after.name} in ${ref.after.location.file}`]
    case "INTERNAL_MOVE":
      return [`Move ${ref.after.type}`, `Moved ${ref.after.type.toLowerCase()} ${ref.after.name} in ${ref.after.location.file}`]
    case "MOVE":
      return [`Move ${ref.after.type}`, `Moved ${ref.after.type.toLowerCase()} ${ref.after.name} from ${ref.before.location.file} to ${ref.after.location.file}`]
    case "INTERNAL_MOVE_RENAME":
      return [`Move and Rename ${ref.after.type}`, `Moved and renamed ${ref.after.type.toLowerCase()} from ${ref.before.name} to ${ref.after.name} in ${ref.after.location.file}`]
    case "MOVE_RENAME":
      return [`Move and Rename ${ref.after.type}`, `Moved and renamed ${ref.after.type.toLowerCase()} from ${ref.before.name} in ${ref.before.location.file} to ${ref.after.name} in ${ref.after.location.file}`]
    case "EXTRACT_SUPER":
      return ["Extract Superclass", `Extracted superclass ${ref.after.name} from ${ref.before.name}`]
    case "EXTRACT":
      return [`Extract ${ref.after.type}`, `Extracted ${ref.after.type.toLowerCase()} ${ref.after.name} from ${ref.before.name}`]
    case "EXTRACT_MOVE":
      return [`Extract and Move ${ref.after.type}`, `Extracted and moved ${ref.after.type.toLowerCase()} ${ref.after.name} from ${ref.before.name}`]
    case "INLINE":
      if (ref.after.type === "Method") {
        return ["Inline Method", `Inlined method ${ref.before.name} into ${ref.after.name}`]
      } else {
        return ["Inline Attribute", `Inlined ${ref.before.name} into ${ref.after.name}`]
      }
  }
}

const extractedMethods = (c: RefDiffCommit): RefDiffRefactoring[] => {
  return c.refactorings
    .filter((r) => r.type === "EXTRACT" && r.after.type === "Method")
}

const extractSourceMethodsCount = (r: RefDiffRefactoring, extractedMethods: RefDiffRefactoring[]): number => {
  return extractedMethods.filter((m) => equal(m.after, r.after)).length
}

const extractMethodExtractedLines = (r: RefDiffRefactoring): number => {
  const startLine = +r.after.location.bodyBegin.split(":")[0]
  const endLine = +r.after.location.bodyEnd.split(":")[0]
  return (endLine - startLine + 1)
}

export const processRefDiffOutput = (repoUrl: string, output: RefDiffOutput): Refactoring[] => {
  return output.map((c): RefDiffCommit => {
    c.refactorings = c.refactorings.flatMap((ref): RefDiffRefactoring[] => {
      switch (ref.type) {
        case "INTERNAL_MOVE_RENAME":
          return [
            {...ref, type: "INTERNAL_MOVE"},
            {...ref, type: "RENAME"},
            ref,
          ]
        case "MOVE_RENAME":
          return [
            {...ref, type: "MOVE"},
            {...ref, type: "RENAME"},
            ref,
          ]
        case "EXTRACT_MOVE":
          return [
            {...ref, type: "EXTRACT"},
            {...ref, type: "MOVE"},
            ref,
          ]
        default:
          return [ref]
      }
    })
    return c
  }).flatMap((c): Refactoring[] => {
    const extractMethodRefactorings = extractedMethods(c)

    return c.refactorings.map((ref): Refactoring => {
      const [typ, description] = formatTypeAndDescription(ref)
      const url = repoUrl.startsWith("https://github.com")
        ? `${repoUrl}/commit/${c.sha1}`
        : repoUrl

      const ret: Refactoring = {
        type: typ,
        description,
        repository: repoUrl,
        commit: c.sha1,
        url,
        extractMethod: {},
        raw: {
          refDiff: ref
        },
        meta: {
          tool: `RefDiff ${refDiffVersion}`
        }
      }

      // Pre-compute needed information
      if (typ === RefactoringType.ExtractMethod) {
        // Use-case 1: 重複の処理が無い / あるextract
        ret.extractMethod.sourceMethodsCount = extractSourceMethodsCount(ref, extractMethodRefactorings)
        // Use-case 2: 数行のみのextract,  extractする前の行数
        ret.extractMethod.extractedLines = extractMethodExtractedLines(ref)
      }

      return ret
    })
  })
}
