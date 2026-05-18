import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { server } from "@/test/msw/server";
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

function renderSidebar(initialEntry = "/app") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

function processCountResponse(total: number) {
  return {
    items: [],
    page: 1,
    pageSize: 1,
    total,
    totalPages: total > 0 ? total : 0,
  };
}

describe("AppSidebar", () => {
  beforeEach(() => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json(processCountResponse(7)),
      ),
    );
  });

  it("shows the support tickets entry for admin users", () => {
    renderSidebar("/admin/chamados");

    const supportLink = screen.getByRole("link", { name: /Chamados/ });

    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute("href", "/admin/chamados");
  });

  it("shows the API-backed process count instead of the old hardcoded badge", async () => {
    const requestedParams: Array<Record<string, string>> = [];

    server.use(
      http.get("http://localhost:3333/api/processes/", ({ request }) => {
        const url = new URL(request.url);

        requestedParams.push({
          page: url.searchParams.get("page") ?? "",
          pageSize: url.searchParams.get("pageSize") ?? "",
        });

        return HttpResponse.json(processCountResponse(7));
      }),
    );

    renderSidebar("/app/processos");

    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(requestedParams).toContainEqual({ page: "1", pageSize: "1" });
    });
  });

  it("shows zero when the API-backed process count is empty", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json(processCountResponse(0)),
      ),
    );

    renderSidebar("/app");

    expect(await screen.findByText("0")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("does not show a process count while the count request is loading", () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", async () => {
        await new Promise(() => {});
        return HttpResponse.json(processCountResponse(7));
      }),
    );

    renderSidebar("/app");

    expect(screen.getByRole("link", { name: /Processos/ })).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();
  });

  it("does not show a mock process count when the count request fails", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json({ message: "Falha ao carregar processos" }, { status: 500 }),
      ),
    );

    renderSidebar("/app");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Processos/ })).toBeInTheDocument();
    });

    expect(screen.queryByText("5")).not.toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();
  });
});
