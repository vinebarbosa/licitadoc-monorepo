import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AdminUsersPage } from "@/modules/users";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

const organizationsResponse = {
  items: [
    {
      id: "organization-1",
      name: "Prefeitura de Sao Paulo",
      slug: "prefeitura-de-sao-paulo",
      officialName: "Prefeitura Municipal de Sao Paulo",
      cnpj: "00.000.000/0001-00",
      city: "Sao Paulo",
      state: "SP",
      address: "Praca da Se, 1",
      zipCode: "01000-000",
      phone: "1133330000",
      institutionalEmail: "contato@saopaulo.gov.br",
      website: null,
      logoUrl: null,
      authorityName: "Maria Silva",
      authorityRole: "Prefeita",
      isActive: true,
      createdByUserId: "user-1",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "organization-2",
      name: "Prefeitura de Recife",
      slug: "prefeitura-de-recife",
      officialName: "Prefeitura Municipal do Recife",
      cnpj: "00.000.000/0001-01",
      city: "Recife",
      state: "PE",
      address: "Avenida Cais do Apolo, 925",
      zipCode: "50030-903",
      phone: "8133330000",
      institutionalEmail: "contato@recife.pe.gov.br",
      website: null,
      logoUrl: null,
      authorityName: "Joana Souza",
      authorityRole: "Prefeita",
      isActive: true,
      createdByUserId: "user-1",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 100,
  total: 2,
  totalPages: 1,
};

const usersResponse = {
  items: [
    {
      id: "user-1",
      name: "Carlos Eduardo Silva",
      email: "carlos.silva@admin.gov.br",
      emailVerified: true,
      image: null,
      role: "admin",
      organizationId: "organization-1",
      createdAt: "2026-04-10T00:00:00.000Z",
      updatedAt: "2026-04-10T00:00:00.000Z",
    },
    {
      id: "user-2",
      name: "Ana Beatriz Lima",
      email: "ana.lima@recife.pe.gov.br",
      emailVerified: true,
      image: null,
      role: "organization_owner",
      organizationId: "organization-2",
      createdAt: "2026-04-12T00:00:00.000Z",
      updatedAt: "2026-04-12T00:00:00.000Z",
    },
    {
      id: "user-3",
      name: "Lucas Mendes",
      email: "lucas.mendes@recife.pe.gov.br",
      emailVerified: true,
      image: null,
      role: "member",
      organizationId: "organization-2",
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 10,
  total: 3,
  totalPages: 1,
};

function renderAdminUsersPage(initialEntry = "/admin/usuarios") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/usuarios" element={<AdminUsersPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminUsersPage", () => {
  it("renders the migrated legacy-aligned layout with API-backed data", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(usersResponse)),
      http.get("http://localhost:3333/api/organizations/", () =>
        HttpResponse.json(organizationsResponse),
      ),
    );

    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Usuários do Sistema" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Carlos Eduardo Silva")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Gerencie todos os usuários cadastrados nas prefeituras"),
    ).toBeInTheDocument();
    expect(screen.getByText("Criar Admin de Organização")).toBeInTheDocument();
    expect(screen.getByText("Total de Usuários")).toBeInTheDocument();
    expect(screen.getByText("Admins de Org.")).toBeInTheDocument();
    expect(screen.getByText("Ana Beatriz Lima")).toBeInTheDocument();
    expect(screen.getAllByText("Prefeitura de Recife")).toHaveLength(2);
    expect(screen.getByText("Mostrando 3 de 3 usuários")).toBeInTheDocument();
  });

  it("restores filters from the URL and requests the corresponding listing", async () => {
    const requestedParams: Array<Record<string, string>> = [];

    server.use(
      http.get("http://localhost:3333/api/users/", ({ request }) => {
        const url = new URL(request.url);

        requestedParams.push({
          page: url.searchParams.get("page") ?? "",
          pageSize: url.searchParams.get("pageSize") ?? "",
          search: url.searchParams.get("search") ?? "",
          role: url.searchParams.get("role") ?? "",
          organizationId: url.searchParams.get("organizationId") ?? "",
        });

        return HttpResponse.json({
          items: [usersResponse.items[1]],
          page: 2,
          pageSize: 10,
          total: 11,
          totalPages: 2,
        });
      }),
      http.get("http://localhost:3333/api/organizations/", () =>
        HttpResponse.json(organizationsResponse),
      ),
    );

    renderAdminUsersPage(
      "/admin/usuarios?page=2&search=ana&role=organization_owner&organizationId=organization-2",
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("ana")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(requestedParams).toContainEqual({
        page: "2",
        pageSize: "10",
        search: "ana",
        role: "organization_owner",
        organizationId: "organization-2",
      });
    });

    expect(screen.getByText("Ana Beatriz Lima")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 de 11 usuários")).toBeInTheDocument();
  });

  it("renders the empty state inside the administrative layout when no users are returned", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        }),
      ),
      http.get("http://localhost:3333/api/organizations/", () =>
        HttpResponse.json(organizationsResponse),
      ),
    );

    renderAdminUsersPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum usuário encontrado")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Tente ajustar os filtros ou criar um novo usuário."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Criar Admin de Organização")).toHaveLength(2);
  });
});
