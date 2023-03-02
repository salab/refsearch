import React, { FunctionComponent, MouseEventHandler, useState } from 'react'
import { Tooltip } from '@mui/material'
import Replay from '@mui/icons-material/Replay'
import { retryJob } from '../api/post.js'

interface Props {
  id: string
}

export const JobRetryButton: FunctionComponent<Props> = ({ id }) => {
  const [text, setText] = useState('Retry this job')
  const onClick: MouseEventHandler = (e) => {
    e.preventDefault()
    setText('Retrying...')
    retryJob(id)
      .then((res) => {
        if (res.status === 200) {
          setText('Job re-queued. Reload page to see new status.')
        } else {
          setText('Something went wrong... try again')
        }
      })
  }

  return (
    <Tooltip title={text}>
      <Replay className='cursor-pointer translate-y-[2px]' onClick={onClick} />
    </Tooltip>
  )
}
