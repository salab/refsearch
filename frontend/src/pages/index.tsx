import {FunctionComponent} from "react";
import {syntax} from "../../../common/parser/parser";
import Search from "@mui/icons-material/Search";
import {Link} from "react-router-dom";
import {Tooltip} from "@mui/material";

const examples: [query: string, desc: string][] = [
  ['description ~ /extract/i', 'Contains \'extract\' in description (case-insensitive)'],
  ['type = "Extract Method"', 'Type is "Extract Method" (exact match)'],
  ['type ~ ^Extract', 'Type begins with "Extract"'],
  ['extractMethod.sourceMethodsCount >= 2', '\'extractMethod.sourceMethodsCount\' field is greater than 1 (Removed duplicated code)'],
]

export const Index: FunctionComponent = () => {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <div className="mx-auto text-slate-800 text-4xl font-bold">RefSearch</div>
        <div className="mx-auto text-slate-400 text-md">
          Automatically index and search refactorings in your repository using RefactoringMiner and RefDiff
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="text-slate-800 text-2xl font-bold">Query Syntax in EBNF</div>
        <div className="text-slate-700 text-md">
          <pre>{syntax}</pre>
        </div>
        <div className="text-slate-700 text-md">
          {`<word>`}: Field name of JSON, chainable with '.' (examples: description, meta.tools)
        </div>
        <div className="text-slate-700 text-md">
          Operators:
          <ul className="list-disc ml-8">
            <li>= equals (exact match, case-sensitive)</li>
            <li>!= not equals</li>
            <li>{'<'} less than (numbers only)</li>
            <li>{'<='} less than or equal</li>
            <li>{'>'} greater than</li>
            <li>{'>='} greater than or equal</li>
            <li>~ regex (PCRE 8.42 with UTF-8 support)</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="text-slate-800 text-2xl font-bold">Examples</div>
        <ul className="text-slate-700 text-md list-disc ml-8 flex flex-col gap-4">
          {examples.map(([query, desc]) => {
            return (
              <li>
                <div>{desc}</div>
                <div className="flex flex-row gap-2">
                  <pre>{query}</pre>
                  <Link to={`/refactorings?q=${encodeURIComponent(query)}`}>
                    <Tooltip title='Try out this query'>
                      <Search className="cursor-pointer translate-y-[-2px]" />
                    </Tooltip>
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
