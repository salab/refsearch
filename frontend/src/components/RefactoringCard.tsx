import {FunctionComponent} from "react";
import {RefactoringWithId} from "../api/refactorings";

interface Props {
  ref: RefactoringWithId
}

export const RefactoringCard: FunctionComponent<Props> = (props) => {
  const ref = props.ref
  return (
    <div>
      {ref.description}
    </div>
  )
}
