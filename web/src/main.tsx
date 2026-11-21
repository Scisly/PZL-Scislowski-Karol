import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { NoticeProvider, SessionProvider } from "./context";
import { Shell } from "./Shell";
import { AuthPage } from "./pages/Auth";
import { ProjectsPage } from "./pages/Projects";
import { ProjectPage } from "./pages/Project";
import { MyTasksPage } from "./pages/MyTasks";
import { AdminPage } from "./pages/Admin";
import { Empty } from "./ui/Feedback";
import "./tokens.css";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: true },
  },
});
const router = createBrowserRouter([
  { path: "/login", element: <AuthPage /> },
  { path: "/register", element: <AuthPage register /> },
  {
    element: <Shell />,
    children: [
      { path: "/", element: <Navigate to="/projects" replace /> },
      { path: "/projects", element: <ProjectsPage /> },
      { path: "/projects/:id", element: <ProjectPage /> },
      { path: "/my-tasks", element: <MyTasksPage /> },
      { path: "/admin", element: <AdminPage /> },
      {
        path: "*",
        element: (
          <Empty title="Nie ma takiej strony">
            Wybierz Projekty w nawigacji, aby wrócić do pracy.
          </Empty>
        ),
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <NoticeProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </NoticeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
