import {FunctionComponent} from "react";
import {Link} from "react-router-dom";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import Build from "@mui/icons-material/Build";
import {RefactoringWithId} from "../../../common/common";
import {fromGitHub, gitHubRepoName, shortSha} from "../../../common/utils";

interface Props {
  refactoring: RefactoringWithId
}

export const RefactoringCard: FunctionComponent<Props> = (props) => {
  const ref = props.refactoring
  return (
    <Link to={`/refactorings/${ref._id}`}>
      <div className="shadow-md border-2 rounded-md border-gray-300 p-3 hover:bg-gray-200 duration-200">
        <div className="flex flex-row justify-between text-gray-600">
          <div>
            {fromGitHub(ref.repository) ?
              <>
                <GitHub className="mr-2 translate-y-[-2px]" />
                <span className="mr-1">{shortSha(ref.sha1)}</span>
                <span className="mr-1">@</span>
                <span>{gitHubRepoName(ref.repository)}</span>
              </> :
              <>
                <Storage className="mr-2 translate-y-[-2px]" />
                <span className="mr-1">{shortSha(ref.sha1)}</span>
                <span className="mr-1">@</span>
                <span>{ref.repository}</span>
              </>
            }
          </div>
          <div>
            <Build fontSize="small" className="mr-2 translate-y-[-2px]" />
            <span>{ref.meta.tool}</span>
          </div>
        </div>
        <div className="text-gray-900 break-words">
          {ref.description}
        </div>
      </div>
    </Link>
  )
}
