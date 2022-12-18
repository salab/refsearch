import React, {FunctionComponent} from "react";
import Launch from "@mui/icons-material/Launch";

interface Props {
  href: string
  text: string
}

export const ExternalLink: FunctionComponent<Props> = ({href, text}) => {
  return (
    <a href={href} target="_blank">
      {text}
      <Launch className="mr-1" fontSize="small" />
    </a>
  )
}
