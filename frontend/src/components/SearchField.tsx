import React, { useEffect, useState } from 'react'
import { TextField, TextFieldProps } from '@mui/material'

interface Props {
  init: string
  placeholder?: string
  variant: TextFieldProps['variant']
  label?: string
  shrink?: boolean
  size?: TextFieldProps['size']
  error?: string
  onUpdate?: (s: string) => void
  onEnter?: (s: string) => void
}

export const useSearchField = ({
                                 init,
                                 placeholder = '',
                                 variant,
                                 label = '',
                                 shrink = false,
                                 size = 'medium',
                                 error = '',
                                 onUpdate,
                                 onEnter,
                               }: Props): {
  field: JSX.Element
  internal: string
  value: string
  setValue: (s: string) => void
} => {
  const [internal, setInternal] = useState(init !== placeholder ? init : '')
  const [value, setValue] = useState(internal || placeholder)

  useEffect(() => {
    if (internal === '') {
      setValue(placeholder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder])

  return {
    field: (
      <TextField
        label={label}
        variant={variant}
        InputLabelProps={{ shrink }}
        placeholder={placeholder}
        fullWidth
        value={internal}
        size={size}
        error={error !== ''}
        helperText={error}
        onChange={(e) => setInternal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const next = internal || placeholder
            if (value !== next) {
              setValue(next)
              onUpdate?.(next)
            }
            onEnter?.(next)
          }
        }}
        onBlur={() => {
          const next = internal || placeholder
          if (value !== next) {
            setValue(next)
            onUpdate?.(next)
          }
        }}
      />
    ),
    internal,
    value,
    setValue: (s) => {
      if (s === placeholder) {
        setInternal('')
        setValue(s)
      } else {
        setInternal(s)
        setValue(s)
      }
    },
  }
}
