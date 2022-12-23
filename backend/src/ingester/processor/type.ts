import {RefactoringMeta} from "../../../../common/common";

export type RefactoringWithoutCommit = Omit<RefactoringMeta, 'commit'>
