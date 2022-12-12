import {FunctionComponent, useState, useEffect} from "react";
import {useParams} from "react-router";
import {Highlight} from "../components/Highlight";
import {getRefactoring} from "../api/refactorings";
import {Refactoring as RefactoringT} from "../../../types/types";

export const Refactoring: FunctionComponent = () => {
  const {rid} = useParams<{ rid: string }>()

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>()
  const [refactoring, setRefactoring] = useState<RefactoringT>()

  useEffect(() => {
    if (!rid) return
    getRefactoring(rid)
      .then((res) => {
        if (res.status === 200) {
          setRefactoring(res.resp)
        } else if (res.status === 400) {
          setError('Malformed id in path')
        } else if (res.status === 404) {
          setError(`Refactoring with id ${rid} not found`)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const exhaustive: never = res
        }
      })
      .finally(() => setLoading(false))
  }, [rid])

  return (
    <div>
      {(error || loading) &&
          <div>
            {loading ? 'Loading...' : `Error: ${error}`}
          </div>
      }
      {refactoring &&
          <Highlight className="language-json m-6 rounded-md border-2 border-green-900 invisible-scrollbar">
            {JSON.stringify(refactoring, null, 2)}
          </Highlight>
      }
    </div>
  )
}