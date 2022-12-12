import {FunctionComponent} from "react";
import {useParams} from "react-router";

export const Refactoring: FunctionComponent = () => {
  const { rid } = useParams<{ rid: string }>()

  return (
    <div>
      Refactoring details page
      rid: {rid}
    </div>
  )
}