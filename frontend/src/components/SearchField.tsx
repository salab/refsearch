import React, {FunctionComponent, useState} from "react";
import {TextField} from "@mui/material";

interface Props {
  name: string
  value: string
  setValue: (s: string) => void
  update: () => void
}

export const SearchField: FunctionComponent<Props> = ({ name, value, setValue, update }) => {
  const [last, setLast] = useState(value)
  return (
    <div className="flex flex-row gap-2">
      <div className="flex-none my-auto">{name} =</div>
      <TextField
        variant="outlined"
        size="small"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value !== last) {
            update()
            setLast(value)
          }
        }}
        onBlur={() => {
          if (value !== last) {
            update()
            setLast(value)
          }
        }}
      />
    </div>
  )
}
