import React, {FunctionComponent} from "react";
import {useParams} from "react-router";
import {Highlight} from "../components/Highlight";
import {Divider} from "@mui/material";
import {ExternalLink} from "../components/ExternalLink";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import Commit from "@mui/icons-material/Commit";
import Description from "@mui/icons-material/Description";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Build from "@mui/icons-material/Build";
import {useGetRefactoring} from "../api/documents";
import {fromGitHub, gitHubRepoName, shortSha} from "../../../common/utils";
import {copyToClipboard} from "../libs/utils";

export const Refactoring: FunctionComponent = () => {
  const {id} = useParams<{ id: string }>()
  const state = useGetRefactoring(id ?? '')

  switch (state.state) {
    case 'loading':
      return <div>Loading...</div>
    case 'error':
      return <div>Error: {state.error}</div>
  }

  const ref = state.res
  const isGitHub = fromGitHub(ref.repository)
  const short = shortSha(ref.sha1)

  return (
    <div className="flex flex-col gap-8">
      <div className="text-3xl font-bold text-gray-700">Refactoring Details</div>
      <Divider />
      <div className="flex flex-col gap-4 text-gray-600">
        <div className="flex flex-row gap-2">
          {isGitHub ? <GitHub /> : <Storage />}
          <div className="font-semibold">Repository</div>
          <ExternalLink href={ref.repository} text={isGitHub ? gitHubRepoName(ref.repository) : ref.repository} />
          <ContentCopy className="translate-y-1" cursor="pointer" fontSize="small" onClick={() => copyToClipboard(ref.repository)} />
        </div>
        <div className="flex flex-row gap-2">
          <Commit />
          <div className="font-semibold">Commit</div>
          <ExternalLink href={ref.commit.url} text={short} />
          <ContentCopy className="translate-y-1" cursor="pointer" fontSize="small" onClick={() => copyToClipboard(ref.sha1)} />
        </div>
        <div className="flex flex-row gap-2">
          <Build />
          <div className="font-semibold">Tool</div>
          {ref.meta.tool}
        </div>
        <div className="flex flex-row gap-2">
          <Description />
          <div className="font-semibold">Description</div>
          <div>{ref.description}</div>
        </div>
      </div>
      <Divider />
      <div className="text-xl text-gray-700">
        Raw
        <Highlight className="text-sm language-json mt-6 rounded-md border-2 border-green-900 invisible-scrollbar">
          {JSON.stringify(ref, null, 2)}
        </Highlight>
      </div>
    </div>
  )
}