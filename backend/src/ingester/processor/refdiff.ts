import equal from "fast-deep-equal/es6";
import {
  ProcessedRefDiffRefactoring,
  RefDiffCommit,
  RefDiffLocation, RefDiffLocationWithLines,
  RefDiffNode, RefDiffNodeWithLines,
  RefDiffOutput,
  RefDiffRefactoring
} from "../../../../common/refdiff";
import {RefactoringWithoutCommit} from "./type";
import {RefactoringType, RefactoringTypes} from "../../../../common/common";
import {commitUrl} from "../../utils";
import {refDiffToolName} from "../runner/refdiff";

type Refactoring = RefactoringWithoutCommit & ProcessedRefDiffRefactoring

const formatTypeAndDescription = (ref: RefDiffRefactoring): [typ: RefactoringType, desc: string] => {
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

const locationLines = (loc: RefDiffLocation): number => {
  const startLine = +loc.bodyBegin.split(":")[0]
  const endLine = +loc.bodyEnd.split(":")[0]
  return (endLine - startLine + 1)
}
const processLocation = (loc: RefDiffLocation): RefDiffLocationWithLines => ({ ...loc, lines: locationLines(loc) })
const processNode = (node: RefDiffNode): RefDiffNodeWithLines => ({ ...node, location: processLocation(node.location) })
const process = (ref: RefDiffRefactoring): ProcessedRefDiffRefactoring => ({
  before: processNode(ref.before),
  after: processNode(ref.after)
})

export const processRefDiffOutput = (repoUrl: string, output: RefDiffOutput): RefactoringWithoutCommit[] => {
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
  }).flatMap((c): RefactoringWithoutCommit[] => {
    const extractMethodRefactorings = extractedMethods(c)

    return c.refactorings.map((ref): RefactoringWithoutCommit => {
      const [typ, description] = formatTypeAndDescription(ref)

      const ret: Refactoring = {
        type: typ,
        description,

        sha1: c.sha1,
        repository: repoUrl,
        url: commitUrl(repoUrl, c.sha1),

        meta: {
          tool: refDiffToolName
        },

        ...process(ref),
      }

      // Pre-compute needed information
      if (typ === RefactoringTypes.ExtractMethod) {
        ret.extractMethod = {
          // Use-case 1: 重複の処理が無い / あるextract
          sourceMethodsCount: extractSourceMethodsCount(ref, extractMethodRefactorings),
          // Use-case 2: 数行のみのextract,  extractする前の行数
          sourceMethodLines: ret.before.location.lines,
          extractedLines: ret.after.location.lines
        }
      }

      // Use-case 3: 具体的なrenameした単語
      if (ref.type === 'RENAME') {
        ret.rename = {
          from: ref.before.name,
          to: ref.after.name,
        }
      }

      return ret
    })
  })
}
