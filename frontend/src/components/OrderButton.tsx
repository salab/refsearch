import React, { useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { ArrowDownward, ArrowUpward } from '@mui/icons-material'

export const useOrderButton = (init: 'asc' | 'desc'): {
  button: JSX.Element
  order: 'asc' | 'desc'
} => {
  const [order, setOrder] = useState<'asc' | 'desc'>(init)
  const tooltip = order === 'asc' ? 'Ascending order' : 'Descending order'
  const toggle = () => setOrder(order === 'asc' ? 'desc' : 'asc')

  return {
    button: (
      <Tooltip title={tooltip}>
        <IconButton onClick={toggle}>
          {order === 'asc' ?
            <ArrowUpward fontSize='medium' /> :
            <ArrowDownward fontSize='medium' />
          }
        </IconButton>
      </Tooltip>
    ),
    order,
  }
}
