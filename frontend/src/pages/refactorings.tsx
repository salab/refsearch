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

const copyToClipboard = (s: string): void => void navigator.clipboard.writeText(s)

export const Refactoring: FunctionComponent = () => {
  const {rid} = useParams<{ rid: string }>()

  const { result: ref, loading, error } = useGetRefactoring(rid ?? '')

  if (loading || error || !ref) {
    return (
      <div>
        {loading ? 'Loading...' : `Error: ${error}`}
      </div>
    )
  }

  const fromGitHub = ref.repository.startsWith('https://github.com/')
  const shortSha = ref.sha1.substring(0, 6)

  return (
    <div className="flex flex-col gap-8">
      <div className="text-3xl font-bold text-gray-700">Refactoring Details</div>
      <Divider />
      <div className="flex flex-col gap-4 text-gray-600">
        <div className="flex flex-row gap-2">
          {fromGitHub ? <GitHub /> : <Storage />}
          <div className="font-semibold">Repository</div>
          <ExternalLink href={ref.repository} text={fromGitHub ? ref.repository.substring("https://github.com/".length) : ref.repository} />
          <ContentCopy className="translate-y-1" cursor="pointer" fontSize="small" onClick={() => copyToClipboard(ref.repository)} />
        </div>
        <div className="flex flex-row gap-2">
          <Commit />
          <div className="font-semibold">Commit</div>
          <ExternalLink href={ref.commit.url} text={shortSha} />
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
