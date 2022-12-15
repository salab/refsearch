import {FunctionComponent} from "react";
import {RefactoringWithId} from "../api/refactorings";
import {Link} from "react-router-dom";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";

interface Props {
  refactoring: RefactoringWithId
}

export const RefactoringCard: FunctionComponent<Props> = (props) => {
  const ref = props.refactoring
  const fromGitHub = ref.repository.startsWith('https://github.com/')
  const shortSha = ref.commit.substring(0, 6)

  return (
    <Link to={`/refactorings/${ref._id}`}>
      <div className="shadow-md border-2 rounded-md border-gray-300 p-3 hover:bg-gray-200 duration-200">
        <div className="text-gray-600">
          {fromGitHub ?
            <>
              <GitHub className="mr-2" />
              <span className="mr-1">{shortSha}</span>
              <span className="mr-1">@</span>
              <span>{ref.repository.substring('https://github.com/'.length)}</span>
            </> :
            <>
              <Storage className="mr-2" />
              <span className="mr-1">{shortSha}</span>
              <span className="mr-1">@</span>
              <span>{ref.repository}</span>
            </>
          }
        </div>
        <div className="text-gray-900">
          {ref.description}
        </div>
      </div>
    </Link>
  )
}
