import {JobStatus, JobWithStrId} from "../../../common/jobs";
import {FunctionComponent} from "react";
import {Link} from "react-router-dom";
import {fromGitHub, gitHubRepoName} from "../../../common/utils";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import {titleCase} from "../libs/utils";
import HourglassEmpty from "@mui/icons-material/HourglassEmpty";
import HourglassFull from "@mui/icons-material/HourglassFull";
import PlayCircle from "@mui/icons-material/PlayCircle";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Error from "@mui/icons-material/Error";

interface Props {
  job: JobWithStrId
}

const statusIcon = (status: JobStatus): JSX.Element => {
  switch (status) {
    case JobStatus.Waiting:
      return <HourglassEmpty className="text-gray-500" />
    case JobStatus.Ready:
      return <HourglassFull className="text-gray-500" />
    case JobStatus.Running:
      return <PlayCircle className="text-cyan-500" />
    case JobStatus.Completed:
      return <CheckCircle className="text-lime-500" />
    case JobStatus.Errored:
      return <Error className="text-red-500" />
  }
}

export const JobCard: FunctionComponent<Props> = ({ job }) => {
  return (
    <Link to={`/jobs/${job._id}`}>
      <div className="shadow-md border-2 rounded-md border-gray-300 p-3 hover:bg-gray-200 duration-200 flex flex-col gap-1">
        <div className="flex flex-row gap-4 text-gray-600">
          {fromGitHub(job.data.repoUrl) ?
            <div>
              <GitHub className="mr-2 translate-y-[-2px]" />
              <span className="mr-1">{job.type}</span>
              <span className="mr-1">@</span>
              <span>{gitHubRepoName(job.data.repoUrl)}</span>
            </div> :
            <div>
              <Storage className="mr-2 translate-y-[-2px]" />
              <span className="mr-1">{job.type}</span>
              <span className="mr-1">@</span>
              <span>{job.data.repoUrl}</span>
            </div>
          }
          <div className="ml-auto">
            <span className="-translate-y-1 mr-1">{statusIcon(job.status)}</span>
            <span>{titleCase(job.status)}</span>
          </div>
        </div>
        {job.status === JobStatus.Errored && (
          <div className="truncate text-gray-500">{job.error}</div>
        )}
      </div>
    </Link>
  )
}
