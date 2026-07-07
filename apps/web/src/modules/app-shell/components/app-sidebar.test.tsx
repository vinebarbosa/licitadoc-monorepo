import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "@/shared/ui/sidebar";
import { currentOrganizationResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AppSidebar } from "./app-sidebar";

const authSessionMock = vi.hoisted(() => ({
  role: "admin" as "admin" | "organization_owner" | "member" | null,
  session: {
    user: {
      id: "admin-1",
      name: "Maria Silva",
      email: "maria@licitadoc.test",
      organizationId: null as string | null,
    },
  },
}));

vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();

  return {
    ...actual,
    useAuthSession: () => authSessionMock,
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
    authSessionMock.role = "admin";
    authSessionMock.session.user.organizationId = null;

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

  it("shows the AI usage entry for admin users", () => {
    renderSidebar("/admin/ia/uso");

    const usageLink = screen.getByRole("link", { name: /Uso de IA/ });

    expect(usageLink).toBeInTheDocument();
    expect(usageLink).toHaveAttribute("href", "/admin/ia/uso");
  });

  it("shows the current organization in the user footer", async () => {
    authSessionMock.role = "member";
    authSessionMock.session.user.organizationId = "organization-1";
    server.use(
      http.get("http://localhost:3333/api/organizations/me", () =>
        HttpResponse.json(currentOrganizationResponse),
      ),
    );

    renderSidebar("/app");

    expect(await screen.findByText(currentOrganizationResponse.name)).toBeInTheDocument();
    expect(screen.queryByText("Analista de Licitações")).not.toBeInTheDocument();
  });

  it("shows organization management for organization owners", async () => {
    authSessionMock.role = "organization_owner";
    authSessionMock.session.user.organizationId = "organization-1";

    renderSidebar("/app/organizacao");

    const organizationLink = await screen.findByRole("link", { name: /Organização/ });

    expect(organizationLink).toHaveAttribute("href", "/app/organizacao");
    expect(screen.queryByRole("link", { name: /Membros/ })).not.toBeInTheDocument();
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
