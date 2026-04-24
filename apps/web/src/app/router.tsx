import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "@/modules/home";
import { AppLayout } from "@/shared/layouts/app-layout";

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
