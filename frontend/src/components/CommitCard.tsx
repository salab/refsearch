import {FunctionComponent} from "react";
import {CommitMeta} from "../../../common/common";
import {Link} from "react-router-dom";
import {fromGitHub, gitHubRepoName, shortSha} from "../../../common/utils";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";

interface Props {
  commit: CommitMeta
}

export const CommitCard: FunctionComponent<Props> = ({ commit }: Props) => {
  return (
    <Link to={`/commits/${commit._id}`}>
      <div className="shadow-md border-2 rounded-md border-gray-300 p-3 hover:bg-gray-200 duration-200">
        <div>
          {fromGitHub(commit.repository) ?
            <>
              <GitHub className="mr-2 translate-y-[-2px]" />
              <span className="mr-1">{shortSha(commit._id)}</span>
              <span className="mr-1">@</span>
              <span>{gitHubRepoName(commit.repository)}</span>
            </> :
            <>
              <Storage className="mr-2 translate-y-[-2px]" />
              <span className="mr-1">{shortSha(commit._id)}</span>
              <span className="mr-1">@</span>
              <span>{commit.repository}</span>
            </>
          }
        </div>
        <div className="text-gray-900 break-words">
          {commit.message}
        </div>
      </div>
    </Link>
  )
}
