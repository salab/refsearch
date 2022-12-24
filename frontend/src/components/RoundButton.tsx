import {FunctionComponent, ReactNode} from "react";

interface Props {
  children?: ReactNode
  onClick?: () => void
}

export const RoundButton: FunctionComponent<Props> = ({ children, onClick }) => {
  return (
    <div className="rounded-full w-8 h-8 bg-gray-100 hover:bg-gray-200 flex cursor-pointer" onClick={onClick}>
      <div className="m-auto">{children}</div>
    </div>
  )
}
