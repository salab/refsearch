import {FunctionComponent} from "react";
import {NavLink} from "react-router-dom";

export const Header: FunctionComponent = () => {
  const activeClass = "bg-slate-500"
  const nav = (path: string, name: string) => (
    <NavLink to={path} className={({isActive}) => (isActive ? activeClass : '') + " m-2 rounded-full px-4 hover:bg-slate-600 flex"}>
      <div className="my-auto">{name}</div>
    </NavLink>
  )

  return (
    <div className="bg-slate-700 w-screen h-12 px-4 flex flex-row">
      <div className="text-gray-50 font-bold text-2xl my-auto">RefSearch</div>
      <div className="ml-6 flex flex-row text-gray-200 h-full w-full">
        <div className="flex flex-row content-center">
          {nav("/", "Refactorings")}
          {nav("/commits", "Commits")}
          {nav("/repositories", "Repositories")}
        </div>
        <div className="ml-auto flex flex-row content-center">
          {nav("/jobs", "Jobs")}
        </div>
      </div>
    </div>
  )
}
