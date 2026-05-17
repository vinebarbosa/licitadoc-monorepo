import { screen } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AppShellLayout } from "./app-shell-layout";

const authSessionMock = vi.hoisted(() => ({
  role: "member" as "admin" | "organization_owner" | "member" | null,
}));

vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();

  return {
    ...actual,
    useAuthSession: () => ({
      role: authSessionMock.role,
    }),
  };
});

vi.mock("../components/app-sidebar", () => ({
  AppSidebar: () => <nav aria-label="Navegação principal" />,
}));

vi.mock("../components/app-header", () => ({
  AppHeader: ({ title }: { title?: string }) => <header>{title ?? "Central de Trabalho"}</header>,
}));

function renderAppShell(role: typeof authSessionMock.role) {
  authSessionMock.role = role;

  const router = createMemoryRouter(
    [
      {
        path: "/app",
        element: <AppShellLayout />,
        children: [{ index: true, element: <main>Conteúdo autenticado</main> }],
      },
    ],
    {
      initialEntries: ["/app"],
    },
  );

  renderWithProviders(<RouterProvider router={router} />);
}

describe("AppShellLayout", () => {
  beforeEach(() => {
    authSessionMock.role = "member";
  });

  it("renders the contextual help widget for member app-shell routes", () => {
    renderAppShell("member");

    expect(screen.getByText("Conteúdo autenticado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir ajuda" })).toBeInTheDocument();
  });

  it("renders the contextual help widget for organization owner app-shell routes", () => {
    renderAppShell("organization_owner");

    expect(screen.getByText("Conteúdo autenticado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir ajuda" })).toBeInTheDocument();
  });

  it("hides the contextual help widget for admin app-shell routes", () => {
    renderAppShell("admin");

    expect(screen.getByText("Conteúdo autenticado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abrir ajuda" })).not.toBeInTheDocument();
  });

  it("does not render the contextual help widget on routes outside the app shell", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/entrar"]}>
        <Routes>
          <Route path="/entrar" element={<main>Entrar</main>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Entrar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abrir ajuda" })).not.toBeInTheDocument();
  });
});
