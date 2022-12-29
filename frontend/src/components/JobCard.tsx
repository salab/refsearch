import {JobStatus, JobWithStrId} from "../../../common/jobs";
import React, {FunctionComponent} from "react";
import {Link} from "react-router-dom";
import {formatDurationHuman, fromGitHub, gitHubRepoName} from "../../../common/utils";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import AccessTime from "@mui/icons-material/AccessTime";
import {titleCase} from "../libs/utils";
import {statusIcon, statusTime} from "../libs/jobs";
import {JobRetryButton} from "./JobRetryButton";

interface Props {
  job: JobWithStrId
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
          <div className="ml-auto flex flex-row gap-2">
            {job.status === JobStatus.Errored && <JobRetryButton id={job._id} />}
            <div>
              <AccessTime className="mr-1" />
              <span>{formatDurationHuman(statusTime(job))}</span>
            </div>
            <div>
              <span className="-translate-y-1 mr-1">{statusIcon(job.status)}</span>
              <span>{titleCase(job.status)}</span>
            </div>
          </div>
        </div>
        {job.status === JobStatus.Errored && (
          <div className="truncate text-gray-500">{job.error}</div>
        )}
      </div>
    </Link>
  )
}
