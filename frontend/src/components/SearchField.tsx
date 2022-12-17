import React, {FunctionComponent, useState} from "react";
import {TextField} from "@mui/material";

interface Props {
  name: string
  setValue: (s: string) => void
}

export const SearchField: FunctionComponent<Props> = ({ name, setValue }) => {
  const [internal, setInternal] = useState('')
  return (
    <div className="flex flex-row gap-2">
      <div className="flex-none my-auto">{name} =</div>
      <TextField
        variant="outlined"
        size="small"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setValue(internal)
          }
        }}
        onBlur={() => setValue(internal)}
      />
    </div>
  )
}
