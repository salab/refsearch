// https://github.com/aserg-ufmg/RefDiff/blob/889b0bfbf2c18726d44f077371966606232cca0b/refdiff-core/src/main/java/refdiff/core/diff/RelationshipType.java
export const RefDiffRefactoringTypes = {
  // Represents nodes that preserved their identities between revisions, but have different types. E.g.: convert a class to an interface.
  ConvertType: 'CONVERT_TYPE',
  // Represents matched nodes whose signature changed. E.g.: add/remove parameter of a function.
  ChangeSignature: 'CHANGE_SIGNATURE',
  // Represents a member of a type that was pulled up to a supertype.
  PullUp: 'PULL_UP',
  // Represents a member of a type that was pushed down to a subtype.
  PushDown: 'PUSH_DOWN',
  // Represents a member of a type whose signature was pulled up to a subtype, keeping its implementation in the original type.
  PullUpSignature: 'PULL_UP_SIGNATURE',
  // Represents a member of a type whose implementation was pushed down to a subtype, keeping its signature in the original type.
  PushDownImpl: 'PUSH_DOWN_IMPL',
  // Represents matched nodes whose names changed.
  Rename: 'RENAME',
  // Represents matched nodes whose parent nodes changed, but not their root parent nodes. E.g.: A method that moved from one inner class to another one, but both are within the same top-level class.
  InternalMove: 'INTERNAL_MOVE',
  // Represents matched nodes whose root parent nodes changed.
  Move: 'MOVE',
  // Represents matched nodes with a combination of INTERNAL_MOVE and RENAME.
  InternalMoveRename: 'INTERNAL_MOVE_RENAME',
  // Represents matched nodes with a combination of MOVE and RENAME.
  MoveRename: 'MOVE_RENAME',
  // Represents that the node after is a supertype extracted from the node before.
  ExtractSuper: 'EXTRACT_SUPER',
  // Represents that the node after is extracted from the node before.
  Extract: 'EXTRACT',
  // Represents that the node after is extracted from the node before and moved to another parent node.
  ExtractMove: 'EXTRACT_MOVE',
  // Represents that the node before is inlined to the node after.
  Inline: 'INLINE',
} as const

export interface RefDiffLocation {
  file: string;
  begin: string;
  end: string;
  bodyBegin: string;
  bodyEnd: string;
}

export type RefDiffNodeType = "Method" | "Class" | "Interface" | "Enum"

export interface RefDiffNode {
  type: RefDiffNodeType;
  name: string;
  location: RefDiffLocation;
}

export type RefDiffRefactoringType = typeof RefDiffRefactoringTypes[keyof typeof RefDiffRefactoringTypes]

export interface RefDiffRefactoring {
  type: RefDiffRefactoringType;
  before: RefDiffNode;
  after: RefDiffNode;
}

export interface RefDiffCommit {
  sha1: string;
  refactorings: RefDiffRefactoring[];
}

export type RefDiffOutput = RefDiffCommit[]

// ---

export type RefDiffLocationWithLines = RefDiffLocation & {
  lines: number
}
export type RefDiffNodeWithLines = Omit<RefDiffNode, 'location'> & {
  location: RefDiffLocationWithLines
}
export interface ProcessedRefDiffRefactoring {
  before: RefDiffNodeWithLines
  after: RefDiffNodeWithLines
}
