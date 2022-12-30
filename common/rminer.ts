// https://github.com/tsantalis/RefactoringMiner
export const RMRefactoringTypes = {
  // supported by RefactoringMiner 1.0 and newer versions
  ExtractMethod: 'Extract Method',
  InlineMethod: 'Inline Method',
  RenameMethod: 'Rename Method',
  MoveMethod: 'Move Method',
  MoveAttribute: 'Move Attribute',
  PullUpMethod: 'Pull Up Method',
  PullUpAttribute: 'Pull Up Attribute',
  PushDownMethod: 'Push Down Method',
  PushDownAttribute: 'Push Down Attribute',
  ExtractSuperclass: 'Extract Superclass',
  ExtractInterface: 'Extract Interface',
  MoveClass: 'Move Class',
  RenameClass: 'Rename Class',
  ExtractAndMoveMethod: 'Extract and Move Method',
  RenamePackage: 'Rename Package',
  // supported by RefactoringMiner 2.0 and newer versions
  MoveAndRenameClass: 'Move and Rename Class',
  ExtractClass: 'Extract Class',
  ExtractSubclass: 'Extract Subclass',
  ExtractVariable: 'Extract Variable',
  InlineVariable: 'Inline Variable',
  ParameterizeVariable: 'Parameterize Variable',
  RenameVariable: 'Rename Variable',
  RenameParameter: 'Rename Parameter',
  RenameAttribute: 'Rename Attribute',
  MoveAndRenameAttribute: 'Move and Rename Attribute',
  ReplaceVariableWithAttribute: 'Replace Variable with Attribute',
  ReplaceAttribute: 'Replace Attribute',
  MergeVariable: 'Merge Variable',
  MergeParameter: 'Merge Parameter',
  MergeAttribute: 'Merge Attribute',
  SplitVariable: 'Split Variable',
  SplitParameter: 'Split Parameter',
  SplitAttribute: 'Split Attribute',
  ChangeVariableType: 'Change Variable Type',
  ChangeParameterType: 'Change Parameter Type',
  ChangeReturnType: 'Change Return Type',
  ChangeAttributeType: 'Change Attribute Type',
  ExtractAttribute: 'Extract Attribute',
  MoveAndRenameMethod: 'Move and Rename Method',
  MoveAndInlineMethod: 'Move and Inline Method',
  // supported by RefactoringMiner 2.1 and newer versions
  AddMethodAnnotation: 'Add Method Annotation',
  RemoveMethodAnnotation: 'Remove Method Annotation',
  ModifyMethodAnnotation: 'Modify Method Annotation',
  AddAttributeAnnotation: 'Add Attribute Annotation',
  RemoveAttributeAnnotation: 'Remove Attribute Annotation',
  ModifyAttributeAnnotation: 'Modify Attribute Annotation',
  AddClassAnnotation: 'Add Class Annotation',
  RemoveClassAnnotation: 'Remove Class Annotation',
  ModifyClassAnnotation: 'Modify Class Annotation',
  AddParameterAnnotation: 'Add Parameter Annotation',
  RemoveParameterAnnotation: 'Remove Parameter Annotation',
  ModifyParameterAnnotation: 'Modify Parameter Annotation',
  AddVariableAnnotation: 'Add Variable Annotation',
  RemoveVariableAnnotation: 'Remove Variable Annotation',
  ModifyVariableAnnotation: 'Modify Variable Annotation',
  AddParameter: 'Add Parameter',
  RemoveParameter: 'Remove Parameter',
  ReorderParameter: 'Reorder Parameter',
  AddThrownExceptionType: 'Add Thrown Exception Type',
  RemoveThrownExceptionType: 'Remove Thrown Exception Type',
  ChangeThrownExceptionType: 'Change Thrown Exception Type',
  ChangeMethodAccessModifier: 'Change Method Access Modifier',
  // supported by RefactoringMiner 2.2 and newer versions
  ChangeAttributeAccessModifier: 'Change Attribute Access Modifier',
  EncapsulateAttribute: 'Encapsulate Attribute',
  ParameterizeAttribute: 'Parameterize Attribute',
  ReplaceAttributeWithVariable: 'Replace Attribute with Variable',
  AddMethodModifier: 'Add Method Modifier',
  RemoveMethodModifier: 'Remove Method Modifier',
  AddAttributeModifier: 'Add Attribute Modifier',
  RemoveAttributeModifier: 'Remove Attribute Modifier',
  AddVariableModifier: 'Add Variable Modifier',
  AddParameterModifier: 'Add Parameter Modifier',
  RemoveVariableModifier: 'Remove Variable Modifier',
  RemoveParameterModifier: 'Remove Parameter Modifier',
  ChangeClassAccessModifier: 'Change Class Access Modifier',
  AddClassModifier: 'Add Class Modifier',
  RemoveClassModifier: 'Remove Class Modifier',
  MovePackage: 'Move Package',
  SplitPackage: 'Split Package',
  MergePackage: 'Merge Package',
  LocalizeParameter: 'Localize Parameter',
  ChangeTypeDeclarationKind: 'Change Type Declaration Kind',
  CollapseHierarchy: 'Collapse Hierarchy',
  ReplaceLoopWithPipeline: 'Replace Loop with Pipeline',
  ReplaceAnonymousWithLambda: 'Replace Anonymous with Lambda',
  // supported by RefactoringMiner 2.3 and newer versions
  MergeClass: 'Merge Class',
  InlineAttribute: 'Inline Attribute',
  ReplacePipelineWithLoop: 'Replace Pipeline with Loop',
  // supported by RefactoringMiner 2.3.2
  SplitClass: 'Split Class',
  SplitConditional: 'Split Conditional',
} as const

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

export type RMRefactoringType = typeof RMRefactoringTypes[keyof typeof RMRefactoringTypes]

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
