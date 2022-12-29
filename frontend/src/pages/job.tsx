import React, {FunctionComponent, useState} from "react";
import {useParams} from "react-router";
import {useGetJob, useGetJobs} from "../api/documents";
import {formatDurationHuman, fromGitHub, gitHubRepoName} from "../../../common/utils";
import {CircularProgress, Divider} from "@mui/material";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import {ExternalLink} from "../components/ExternalLink";
import {CopyButton} from "../components/CopyButton";
import {Highlight} from "../components/Highlight";
import {titleCase} from "../libs/utils";
import {statusIcon, statusTime} from "../libs/jobs";
import {JobStatus} from "../../../common/jobs";
import {AccessTime} from "@mui/icons-material";
import {usePager} from "../components/Pager";
import {JobCard} from "../components/JobCard";

const perPage = 10

export const Job: FunctionComponent = () => {
  const {id} = useParams<{ id: string }>()
  const state = useGetJob(id ?? '')

  const [page, setPage] = useState(0)
  const jobsState = useGetJobs(`pipeline = ${state.res?.pipeline ?? '0'}`, perPage, page, '_id', 'asc')
  const { pager, resultText } = usePager(page, setPage, jobsState, perPage)

  switch (state.state) {
    case 'loading':
      return <div>Loading...</div>
    case 'error':
      return <div>Error: {state.error}</div>
  }

  const job = state.res
  const url = job.data.repoUrl
  const isGitHub = fromGitHub(url)
  const repoName = isGitHub ? gitHubRepoName(url) : url

  return (
    <div className="flex flex-col gap-8">
      <div className="text-3xl font-bold text-gray-700">Job Details {job.type} for {repoName}</div>
      <Divider />
      <div className="flex flex-col gap-4 text-gray-600">
        <div className="flex flex-row gap-2">
          {isGitHub ? <GitHub /> : <Storage />}
          <div className="font-semibold">Repository</div>
          <ExternalLink href={url} text={repoName} />
          <CopyButton tooltip="Copy URL" copyText={url} />
        </div>
        <div className="flex flex-row gap-2">
          {statusIcon(job.status)}
          <div className="font-semibold">Status</div>
          <div>
            {titleCase(job.status)} {[JobStatus.Errored, JobStatus.Completed].includes(job.status) ? 'in' : 'for'} {formatDurationHuman(statusTime(job))}
          </div>
        </div>
        <div className="flex flex-row gap-2">
          <AccessTime />
          <div className="font-semibold">Queued</div>
          <div>{formatDurationHuman(new Date().getTime() - new Date(job.queuedAt).getTime())} ago</div>
        </div>
        {job.startedAt && (
          <div className="flex flex-row gap-2">
            <AccessTime />
            <div className="font-semibold">Started</div>
            <div>{formatDurationHuman(new Date().getTime() - new Date(job.startedAt).getTime())} ago</div>
          </div>
        )}
        {job.completedAt && (
          <div className="flex flex-row gap-2">
            <AccessTime />
            <div className="font-semibold">Completed</div>
            <div>{formatDurationHuman(new Date().getTime() - new Date(job.completedAt).getTime())} ago</div>
          </div>
        )}
      </div>
      <Divider />
      <div className="text-lg font-semibold">Jobs in this pipeline</div>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between h-12">
          <div className="m-auto">{pager}</div>
          <div className="my-auto text-md text-right">{resultText}</div>
        </div>
        {jobsState.state === 'loading' ? (
          <CircularProgress className="mx-auto" />
        ) : jobsState.state === 'success' ? jobsState.res.map((job, i) => (
          <div key={i}>
            <JobCard job={job}/>
          </div>
        )) : <div>Error</div>}
      </div>
      <Divider />
      <div className="text-xl text-gray-700">
        Raw
        <Highlight className="text-sm language-json mt-6 rounded-md border-2 border-green-900 invisible-scrollbar">
          {JSON.stringify(job, null, 2)}
        </Highlight>
      </div>
    </div>
  )
}
