import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OwnerMembersPage } from "@/modules/users";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const membersResponse = {
  items: [
    {
      id: "user-2",
      name: "Ana Beatriz Lima",
      email: "ana.lima@prefeitura.gov.br",
      emailVerified: true,
      image: null,
      role: "member",
      organizationId: "organization-1",
      onboardingStatus: "complete",
      createdAt: "2026-04-12T00:00:00.000Z",
      updatedAt: "2026-04-12T00:00:00.000Z",
    },
    {
      id: "user-3",
      name: "Carlos Mendez",
      email: "carlos.mendez@prefeitura.gov.br",
      emailVerified: true,
      image: null,
      role: "member",
      organizationId: "organization-1",
      onboardingStatus: "complete",
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 20,
  total: 2,
  totalPages: 1,
};

const emptyMembersResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
};

const pendingProfileMemberResponse = {
  items: [
    {
      id: "user-pending-1",
      name: "novo.membro@prefeitura.gov.br",
      email: "novo.membro@prefeitura.gov.br",
      emailVerified: false,
      image: null,
      role: "member",
      organizationId: "organization-1",
      onboardingStatus: "pending_profile",
      createdAt: "2026-05-02T00:00:00.000Z",
      updatedAt: "2026-05-02T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  totalPages: 1,
};

const invitesResponse = {
  items: [
    {
      id: "invite-1",
      email: "novo.membro@prefeitura.gov.br",
      role: "member",
      organizationId: "organization-1",
      invitedByUserId: "user-owner-1",
      provisionedUserId: null,
      acceptedByUserId: null,
      status: "pending",
      expiresAt: "2026-05-29T00:00:00.000Z",
      acceptedAt: null,
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  totalPages: 1,
};

const departmentsResponse = {
  items: [
    {
      id: "department-1",
      name: "Secretaria de Educacao",
      slug: "secretaria-de-educacao",
      organizationId: "organization-1",
      budgetUnitCode: "06.001",
      responsibleName: "Maria Costa",
      responsibleRole: "Secretaria",
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 100,
  total: 1,
  totalPages: 1,
};

const emptyDepartmentsResponse = {
  items: [],
  page: 1,
  pageSize: 100,
  total: 0,
  totalPages: 0,
};

function renderOwnerMembersPage() {
  return renderWithProviders(
    <MemoryRouter initialEntries={["/app/membros"]}>
      <Routes>
        <Route path="/app/membros" element={<OwnerMembersPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function openDepartmentsTab() {
  const tab = await screen.findByRole("tab", { name: "Departamentos" });

  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
}

describe("OwnerMembersPage", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("renders member list without a standalone pending invites section", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(membersResponse)),
      http.get("http://localhost:3333/api/invites/", () => HttpResponse.json(invitesResponse)),
    );

    renderOwnerMembersPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Administração da Organização" }),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Ana Beatriz Lima")).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: "Membros" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Departamentos" })).toBeInTheDocument();
    expect(screen.getByText("Carlos Mendez")).toBeInTheDocument();
    expect(screen.getByText("Convidar membro")).toBeInTheDocument();
    expect(screen.queryByText("Convites pendentes")).not.toBeInTheDocument();
    expect(screen.queryByText("novo.membro@prefeitura.gov.br")).not.toBeInTheDocument();
  });

  it("renders pending invited members returned by the users API", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () =>
        HttpResponse.json(pendingProfileMemberResponse),
      ),
    );

    renderOwnerMembersPage();

    await waitFor(() => {
      expect(screen.getAllByText("novo.membro@prefeitura.gov.br").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("Nenhum membro encontrado")).not.toBeInTheDocument();
    expect(screen.queryByText("Convites pendentes")).not.toBeInTheDocument();
  });

  it("renders an empty state with invite action when no members exist", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(emptyMembersResponse)),
    );

    renderOwnerMembersPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum membro encontrado")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Convide membros para dar acesso à sua organização."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Convidar membro")).toHaveLength(2);
  });

  it("refreshes the members list after inviting a provisioned pending member", async () => {
    let invited = false;

    server.use(
      http.get("http://localhost:3333/api/users/", () =>
        HttpResponse.json(invited ? pendingProfileMemberResponse : emptyMembersResponse),
      ),
      http.post("http://localhost:3333/api/invites/", async ({ request }) => {
        const body = (await request.json()) as { email: string };

        invited = true;

        return HttpResponse.json(
          {
            id: "invite-2",
            email: body.email,
            role: "member",
            organizationId: "organization-1",
            invitedByUserId: "user-owner-1",
            provisionedUserId: "user-pending-1",
            acceptedByUserId: null,
            status: "pending",
            expiresAt: "2026-05-29T00:00:00.000Z",
            acceptedAt: null,
            createdAt: "2026-05-02T00:00:00.000Z",
            updatedAt: "2026-05-02T00:00:00.000Z",
          },
          { status: 201 },
        );
      }),
    );

    renderOwnerMembersPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum membro encontrado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Convidar membro")[0]);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "novo.membro@prefeitura.gov.br" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    await waitFor(() => {
      expect(screen.getAllByText("novo.membro@prefeitura.gov.br").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Nenhum membro encontrado")).not.toBeInTheDocument();
    expect(screen.queryByText("Convites pendentes")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      "Convite enviado para novo.membro@prefeitura.gov.br.",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows invite error feedback without a misleading success message", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(emptyMembersResponse)),
      http.post("http://localhost:3333/api/invites/", () =>
        HttpResponse.json(
          {
            error: "conflict",
            message: "Já existe um convite pendente para este e-mail.",
          },
          { status: 409 },
        ),
      ),
    );

    renderOwnerMembersPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum membro encontrado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Convidar membro")[0]);
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "novo.membro@prefeitura.gov.br" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar convite" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Já existe um convite pendente para este e-mail.");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Convidar membro" })).toBeInTheDocument();
  });

  it("renders owner-scoped departments in the departments tab", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(membersResponse)),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json(departmentsResponse),
      ),
    );

    renderOwnerMembersPage();

    await openDepartmentsTab();

    await waitFor(() => {
      expect(screen.getByText("Secretaria de Educacao")).toBeInTheDocument();
    });

    expect(screen.getByText("06.001")).toBeInTheDocument();
    expect(screen.getByText("Maria Costa")).toBeInTheDocument();
    expect(screen.getByText("Secretaria")).toBeInTheDocument();
    expect(screen.getByText("Criar departamento")).toBeInTheDocument();
  });

  it("renders the department empty state with a create action", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(membersResponse)),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json(emptyDepartmentsResponse),
      ),
    );

    renderOwnerMembersPage();

    await openDepartmentsTab();

    await waitFor(() => {
      expect(screen.getByText("Nenhum departamento cadastrado")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Crie o primeiro departamento para usar nos processos e documentos."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Criar departamento")).toHaveLength(2);
  });

  it("shows department load errors and retries the listing", async () => {
    let shouldFail = true;

    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(membersResponse)),
      http.get("http://localhost:3333/api/departments/", () => {
        if (shouldFail) {
          return HttpResponse.json(
            {
              error: "internal_server_error",
              message: "Falha ao carregar departamentos.",
            },
            { status: 500 },
          );
        }

        return HttpResponse.json(departmentsResponse);
      }),
    );

    renderOwnerMembersPage();

    await openDepartmentsTab();

    await waitFor(() => {
      expect(screen.getByText("Erro ao carregar departamentos")).toBeInTheDocument();
    });

    shouldFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => {
      expect(screen.getByText("Secretaria de Educacao")).toBeInTheDocument();
    });
  });

  it("creates a department from the departments tab", async () => {
    const createdDepartment = {
      id: "department-created",
      name: "Secretaria de Saude",
      slug: "secretaria-de-saude",
      organizationId: "organization-1",
      budgetUnitCode: "07.001",
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
      createdAt: "2026-05-02T00:00:00.000Z",
      updatedAt: "2026-05-02T00:00:00.000Z",
    };
    const createdDepartments = [createdDepartment];
    const submittedBodies: unknown[] = [];

    let departments: typeof createdDepartments = [];

    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(membersResponse)),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json({
          ...emptyDepartmentsResponse,
          items: departments,
          total: departments.length,
          totalPages: departments.length > 0 ? 1 : 0,
        }),
      ),
      http.post("http://localhost:3333/api/departments/", async ({ request }) => {
        const body = await request.json();

        submittedBodies.push(body);
        departments = createdDepartments;

        return HttpResponse.json(createdDepartment, { status: 201 });
      }),
    );

    renderOwnerMembersPage();

    await openDepartmentsTab();

    await waitFor(() => {
      expect(screen.getByText("Nenhum departamento cadastrado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Criar departamento")[0]);

    const dialog = await screen.findByRole("dialog", { name: "Criar departamento" });
    const submitButton = within(dialog).getByRole("button", { name: "Criar departamento" });

    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("Nome"), {
      target: { value: "Secretaria de Saúde" },
    });
    expect(within(dialog).getByLabelText("Identificador")).toHaveValue("secretaria-de-saude");

    fireEvent.change(within(dialog).getByLabelText("Unidade orçamentária"), {
      target: { value: "07.001" },
    });
    fireEvent.change(within(dialog).getByLabelText("Responsável"), {
      target: { value: "Ana Souza" },
    });
    fireEvent.change(within(dialog).getByLabelText("Cargo do responsável"), {
      target: { value: "Secretaria" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Secretaria de Saude")).toBeInTheDocument();
    });

    expect(submittedBodies).toContainEqual({
      name: "Secretaria de Saúde",
      slug: "secretaria-de-saude",
      budgetUnitCode: "07.001",
      responsibleName: "Ana Souza",
      responsibleRole: "Secretaria",
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Departamento Secretaria de Saude criado com sucesso.",
    );
  });

  it("shows department create API rejection feedback and keeps the dialog open", async () => {
    server.use(
      http.get("http://localhost:3333/api/users/", () => HttpResponse.json(membersResponse)),
      http.get("http://localhost:3333/api/departments/", () =>
        HttpResponse.json(emptyDepartmentsResponse),
      ),
      http.post("http://localhost:3333/api/departments/", () =>
        HttpResponse.json(
          {
            error: "conflict",
            message: "Já existe um departamento com este identificador.",
            details: null,
          },
          { status: 409 },
        ),
      ),
    );

    renderOwnerMembersPage();

    await openDepartmentsTab();

    await waitFor(() => {
      expect(screen.getByText("Nenhum departamento cadastrado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("Criar departamento")[0]);

    const dialog = await screen.findByRole("dialog", { name: "Criar departamento" });

    fireEvent.change(within(dialog).getByLabelText("Nome"), {
      target: { value: "Secretaria de Saúde" },
    });
    fireEvent.change(within(dialog).getByLabelText("Responsável"), {
      target: { value: "Ana Souza" },
    });
    fireEvent.change(within(dialog).getByLabelText("Cargo do responsável"), {
      target: { value: "Secretaria" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Criar departamento" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Já existe um departamento com este identificador.");
    });

    expect(screen.getByRole("dialog", { name: "Criar departamento" })).toBeInTheDocument();
  });
});
