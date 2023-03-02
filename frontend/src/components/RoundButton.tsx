import { FunctionComponent, ReactNode } from 'react'
import { Tooltip } from '@mui/material'

interface Props {
  children?: ReactNode
  tooltip?: string
  onClick?: () => void
}

export const RoundButton: FunctionComponent<Props> = ({ children, tooltip, onClick }) => {
  const button = (
    <div className='rounded-full w-8 h-8 bg-gray-100 hover:bg-gray-200 flex cursor-pointer' onClick={onClick}>
      <div className='m-auto'>{children}</div>
    </div>
  )

  if (tooltip) {
    return (
      <Tooltip title={tooltip}>{button}</Tooltip>
    )
  } else {
    return button
  }
}
