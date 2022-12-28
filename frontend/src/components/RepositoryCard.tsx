import {RepositoryMeta} from "../../../common/common";
import {FunctionComponent} from "react";
import {Link} from "react-router-dom";
import {fromGitHub, gitHubRepoName} from "../../../common/utils";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import Numbers from "@mui/icons-material/Numbers";

interface Props {
  repository: RepositoryMeta
}

export const RepositoryCard: FunctionComponent<Props> = ({ repository }) => {
  return (
    <Link to={`/repositories/${encodeURIComponent(repository._id)}`}>
      <div className="shadow-md border-2 rounded-md border-gray-300 p-3 hover:bg-gray-200 duration-200">
        <div className="flex flex-row gap-4 text-gray-600">
          {fromGitHub(repository._id) ?
            <div>
              <GitHub className="mr-2 translate-y-[-2px]" />
              <span>{gitHubRepoName(repository._id)}</span>
            </div> :
            <div>
              <Storage className="mr-2 translate-y-[-2px]" />
              <span>{repository._id}</span>
            </div>
          }
        </div>
        <div className="text-gray-900 mt-2">
          <Numbers className="mr-1 translate-y-[-2px]" fontSize="small" />
          <span className="mr-2">Detected Refactorings</span>
          <span>{repository.refactorings.total}</span>
        </div>
      </div>
    </Link>
  )
}
