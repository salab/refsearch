import React, {FunctionComponent} from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter, Outlet,
  RouterProvider,
} from 'react-router-dom';
import './index.css';
import {Header} from "./components/Header";
import {Index} from './pages';
import {Commits} from "./pages/commits";
import {Refactoring} from "./pages/refactorings";

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
        path: '/commits',
        element: <Commits />
      },
      {
        path: '/refactorings/:rid',
        element: <Refactoring />
      }
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
