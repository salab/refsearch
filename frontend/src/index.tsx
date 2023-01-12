import React, {FunctionComponent} from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from 'react-router-dom';
import './index.css';
import {Header} from "./components/Header";
import {Refactorings} from './pages/refactorings';
import {Commits} from "./pages/commits";
import {Refactoring} from "./pages/refactoring";
import {Commit} from "./pages/commit";
import {Repositories} from "./pages/repositories";
import {Repository} from "./pages/repository";
import {Jobs} from "./pages/jobs";
import {Job} from "./pages/job";
import {Index} from "./pages";

const Layout: FunctionComponent = () => (
  <div>
    <Header />
    <div className="p-12">
      <Outlet />
    </div>
  </div>
)

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Index />
      },
      {
        path: '/refactorings',
        element: <Refactorings />
      },
      {
        path: '/refactorings/:id',
        element: <Refactoring />
      },
      {
        path: '/commits',
        element: <Commits />
      },
      {
        path: '/commits/:id',
        element: <Commit />
      },
      {
        path: '/repositories',
        element: <Repositories />
      },
      {
        path: '/repositories/:id',
        element: <Repository />
      },
      {
        path: '/jobs',
        element: <Jobs />
      },
      {
        path: '/jobs/:id',
        element: <Job />
      },
    ]
  }
])

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
