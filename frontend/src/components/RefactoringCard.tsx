import {FunctionComponent} from "react";
import {RefactoringWithId} from "../api/refactorings";
import {Link} from "react-router-dom";

interface Props {
  refactoring: RefactoringWithId
}

export const RefactoringCard: FunctionComponent<Props> = (props) => {
  const ref = props.refactoring

  return (
    <div>
      <Link to={`/refactorings/${ref._id}`}>
        {ref.description}
      </Link>
    </div>
  )
}
