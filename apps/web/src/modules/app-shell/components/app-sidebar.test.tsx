import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { renderWithProviders } from "@/test/render";
import { AppSidebar } from "./app-sidebar";

vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();

  return {
    ...actual,
    useAuthSession: () => ({
      role: "admin",
      session: {
        user: {
          id: "admin-1",
          name: "Maria Silva",
          email: "maria@licitadoc.test",
        },
      },
    }),
    useSignOut: () => ({
      isPending: false,
      mutateAsync: vi.fn(),
    }),
  };
});

describe("AppSidebar", () => {
  it("shows the support tickets entry for admin users", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/admin/chamados"]}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const supportLink = screen.getByRole("link", { name: /Chamados/ });

    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute("href", "/admin/chamados");
  });
});
