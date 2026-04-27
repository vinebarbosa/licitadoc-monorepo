import { screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { RequireSession } from "./route-guards";

describe("RequireSession", () => {
  it("redirects unauthenticated users to the sign-in route", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/privado",
          element: (
            <RequireSession isAuthenticated={false}>
              <div>Área protegida</div>
            </RequireSession>
          ),
        },
        {
          path: "/entrar",
          element: <div>Página de login</div>,
        },
        {
          path: "/nao-autorizado",
          element: <div>Sem acesso</div>,
        },
      ],
      { initialEntries: ["/privado?status=aberto"] },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Página de login")).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/entrar");
    expect(router.state.location.search).toBe("?redirectTo=%2Fprivado%3Fstatus%3Daberto");
  });

  it("redirects authenticated users without permission to the unauthorized route", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/privado",
          element: (
            <RequireSession isAuthenticated isAuthorized={false}>
              <div>Área protegida</div>
            </RequireSession>
          ),
        },
        {
          path: "/entrar",
          element: <div>Página de login</div>,
        },
        {
          path: "/nao-autorizado",
          element: <div>Sem acesso</div>,
        },
      ],
      { initialEntries: ["/privado"] },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Sem acesso")).toBeInTheDocument();
    });
  });
});
