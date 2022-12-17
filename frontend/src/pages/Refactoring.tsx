import {FunctionComponent} from "react";
import {useParams} from "react-router";
import {Highlight} from "../components/Highlight";
import {useGetRefactoring} from "../api/refactorings";

export const Refactoring: FunctionComponent = () => {
  const {rid} = useParams<{ rid: string }>()

  const { result, loading, error } = useGetRefactoring(rid ?? '')

  return (
    <div>
      {(error || loading) &&
          <div>
            {loading ? 'Loading...' : `Error: ${error}`}
          </div>
      }
      {result &&
          <Highlight className="language-json m-6 rounded-md border-2 border-green-900 invisible-scrollbar">
            {JSON.stringify(result, null, 2)}
          </Highlight>
      }
    </div>
  )
}
