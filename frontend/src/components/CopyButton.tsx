import {FunctionComponent, useState} from "react";
import {Tooltip} from "@mui/material";
import ContentCopy from "@mui/icons-material/ContentCopy";
import {copyToClipboard} from "../libs/utils";

interface Props {
  tooltip?: string
  copyText: string
}

export const CopyButton: FunctionComponent<Props> = ({ tooltip = 'Click to copy', copyText }) => {
  const [text, setText] = useState(tooltip)
  const onClick = () => {
    copyToClipboard(copyText)
    setText('Copied!')
  }

  return (
    <Tooltip title={text}>
      <ContentCopy className="translate-y-1 cursor-pointer" fontSize="small" onClick={onClick} />
    </Tooltip>
  )
}
