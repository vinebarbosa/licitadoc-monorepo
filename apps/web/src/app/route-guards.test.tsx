import { screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { RequireCompletedOnboarding, RequireOnboardingStep, RequireSession } from "./route-guards";

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

  it("redirects incomplete users away from completed app routes", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/app",
          element: (
            <RequireCompletedOnboarding onboardingStatus="pending_profile">
              <div>Central</div>
            </RequireCompletedOnboarding>
          ),
        },
        {
          path: "/onboarding/perfil",
          element: <div>Complete seu perfil</div>,
        },
      ],
      { initialEntries: ["/app"] },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Complete seu perfil")).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/onboarding/perfil");
  });

  it("keeps pending members on completed app routes so the shell modal can block usage", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/app",
          element: (
            <RequireCompletedOnboarding onboardingStatus="pending_profile" role="member">
              <div>Central</div>
            </RequireCompletedOnboarding>
          ),
        },
        {
          path: "/onboarding/perfil",
          element: <div>Complete seu perfil</div>,
        },
      ],
      { initialEntries: ["/app"] },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Central")).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/app");
  });

  it("keeps onboarding users on the expected step", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/onboarding/organizacao",
          element: (
            <RequireOnboardingStep
              onboardingStatus="pending_organization"
              expectedStatus="pending_organization"
            >
              <div>Dados da organização</div>
            </RequireOnboardingStep>
          ),
        },
        {
          path: "/app",
          element: <div>Central</div>,
        },
      ],
      { initialEntries: ["/onboarding/organizacao"] },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Dados da organização")).toBeInTheDocument();
    });
  });

  it("redirects complete users away from onboarding routes", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/onboarding/perfil",
          element: (
            <RequireOnboardingStep onboardingStatus="complete" expectedStatus="pending_profile">
              <div>Complete seu perfil</div>
            </RequireOnboardingStep>
          ),
        },
        {
          path: "/app",
          element: <div>Central</div>,
        },
      ],
      { initialEntries: ["/onboarding/perfil"] },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText("Central")).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/app");
  });
});
