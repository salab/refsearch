import React, { FunctionComponent } from 'react'
import { useParams } from 'react-router'
import { useGetRepository } from '../api/documents.js'
import { fromGitHub, gitHubRepoName } from '../../../common/utils.js'
import { Divider } from '@mui/material'
import GitHub from '@mui/icons-material/GitHub'
import Storage from '@mui/icons-material/Storage'
import { ExternalLink } from '../components/ExternalLink.js'
import { CopyButton } from '../components/CopyButton.js'
import { Highlight } from '../components/Highlight.js'
import Numbers from '@mui/icons-material/Numbers'

export const Repository: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>()
  const state = useGetRepository(id ?? '')

  switch (state.state) {
    case 'loading':
      return <div>Loading...</div>
    case 'error':
      return <div>Error: {state.error}</div>
  }

  const r = state.res
  const url = r._id
  const isGitHub = fromGitHub(url)

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-3xl font-bold text-gray-700'>Repository Details</div>
      <Divider />
      <div className='flex flex-col gap-4 text-gray-600'>
        <div className='flex flex-row gap-2'>
          {isGitHub ? <GitHub /> : <Storage />}
          <div className='font-semibold'>URL</div>
          <ExternalLink href={url} text={isGitHub ? gitHubRepoName(url) : url} />
          <CopyButton tooltip='Copy URL' copyText={url} />
        </div>
        <div className='flex flex-row gap-2'>
          <Numbers />
          <div className='font-semibold'>Detected Refactorings</div>
          <div>{r.refactorings.total}</div>
        </div>
      </div>
      <Divider />
      <div className='text-xl text-gray-700'>
        Raw
        <Highlight className='text-sm language-json mt-6 rounded-md border-2 border-green-900 invisible-scrollbar'>
          {JSON.stringify(r, null, 2)}
        </Highlight>
      </div>
    </div>
  )
}
