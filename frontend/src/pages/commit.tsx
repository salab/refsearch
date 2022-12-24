import React, {FunctionComponent, useState} from "react";
import {useParams} from "react-router";
import {useGetCommit, useGetRefactorings} from "../api/documents";
import {fromGitHub, gitHubRepoName, shortSha} from "../../../common/utils";
import {CircularProgress, Divider} from "@mui/material";
import GitHub from "@mui/icons-material/GitHub";
import Storage from "@mui/icons-material/Storage";
import {ExternalLink} from "../components/ExternalLink";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Description from "@mui/icons-material/Description";
import CommitIcon from "@mui/icons-material/Commit";
import {Highlight} from "../components/Highlight";
import {copyToClipboard} from "../libs/utils";
import {usePager} from "../components/Pager";
import {RefactoringCard} from "../components/RefactoringCard";

const perPage = 10

export const Commit: FunctionComponent = () => {
  const {id} = useParams<{ id: string }>()
  const state = useGetCommit(id ?? '')

  const [page, setPage] = useState(0)
  const refsState = useGetRefactorings(`sha1 = ${id}`, perPage, page, 'type', 'asc')
  const { pager, resultText } = usePager(page, setPage, refsState, perPage)

  switch (state.state) {
    case 'loading':
      return <div>Loading...</div>
    case 'error':
      return <div>Error: {state.error}</div>
  }

  const c = state.res
  const isGitHub = fromGitHub(c.repository)
  const short = shortSha(c._id)

  return (
    <div className="flex flex-col gap-8">
      <div className="text-3xl font-bold text-gray-700">Commit Details</div>
      <Divider />
      <div className="flex flex-col gap-4 text-gray-600">
        <div className="flex flex-row gap-2">
          {isGitHub ? <GitHub /> : <Storage />}
          <div className="font-semibold">Repository</div>
          <ExternalLink href={c.repository} text={isGitHub ? gitHubRepoName(c.repository) : c.repository} />
          <ContentCopy className="translate-y-1" cursor="pointer" fontSize="small" onClick={() => copyToClipboard(c.repository)} />
        </div>
        <div className="flex flex-row gap-2">
          <CommitIcon />
          <div className="font-semibold">Commit</div>
          <ExternalLink href={c.url} text={short} />
          <ContentCopy className="translate-y-1" cursor="pointer" fontSize="small" onClick={() => copyToClipboard(c._id)} />
        </div>
        <div className="flex flex-row gap-2">
          <Description />
          <div className="font-semibold">Message</div>
          <div className="flex flex-col gap-2">
            <div>{c.message}</div>
            {c.body && <pre className="text-sm text-gray-400">{c.body}</pre>}
          </div>
        </div>
      </div>
      <Divider />
      <div className="text-lg font-semibold">Refactorings in this commit</div>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between h-12">
          <div className="m-auto">{pager}</div>
          <div className="my-auto text-md text-right">{resultText}</div>
        </div>
        {refsState.state === 'loading' ? (
          <CircularProgress className="mx-auto" />
        ) : refsState.state === 'success' ? refsState.res.map((ref, i) => (
          <div key={i}>
            <RefactoringCard refactoring={ref}/>
          </div>
        )) : <div>Error</div>}
      </div>
      <Divider />
      <div className="text-xl text-gray-700">
        Raw
        <Highlight className="text-sm language-json mt-6 rounded-md border-2 border-green-900 invisible-scrollbar">
          {JSON.stringify(c, null, 2)}
        </Highlight>
      </div>
    </div>
  )
}
