import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./routes/app-layout";
import { HomePage } from "./routes/home-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]);
