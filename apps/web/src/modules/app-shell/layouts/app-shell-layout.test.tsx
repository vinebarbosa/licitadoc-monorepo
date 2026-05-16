import { screen } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AppShellLayout } from "./app-shell-layout";

vi.mock("../components/app-sidebar", () => ({
  AppSidebar: () => <nav aria-label="Navegação principal" />,
}));

vi.mock("../components/app-header", () => ({
  AppHeader: ({ title }: { title?: string }) => <header>{title ?? "Central de Trabalho"}</header>,
}));

describe("AppShellLayout", () => {
  it("renders the contextual help widget on app-shell routes", () => {
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

    expect(screen.getByText("Conteúdo autenticado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir ajuda" })).toBeInTheDocument();
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
