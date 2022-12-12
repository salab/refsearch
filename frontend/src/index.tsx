import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import {Home} from './pages/Home';
import './index.css';
import {Refactoring} from "./pages/Refactoring";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/refactorings/:rid',
    element: <Refactoring />
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
