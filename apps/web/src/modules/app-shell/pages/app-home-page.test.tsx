import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processesListResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AppHomePage } from "./app-home-page";

const authSessionMock = vi.hoisted(() => ({
  organizationId: "organization-1" as string | null,
  role: "member" as "admin" | "organization_owner" | "member" | null,
}));

vi.mock("@/modules/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/auth")>();

  return {
    ...actual,
    useAuthSession: () => authSessionMock,
  };
});

function renderHomePage() {
  return renderWithProviders(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route path="/app" element={<AppHomePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppHomePage", () => {
  beforeEach(() => {
    authSessionMock.organizationId = "organization-1";
    authSessionMock.role = "member";
  });

  it("renders the validated home layout with quick actions, process resume cards, and API processes", async () => {
    const requestedParams: Array<Record<string, string>> = [];
    const homeProcessesResponse = {
      ...processesListResponse,
      items: [
        processesListResponse.items[0],
        {
          ...processesListResponse.items[0],
          id: "process-2",
          processNumber: "PE-2024-044",
          title: "Material de Escritório",
          object: "Aquisição de Material de Escritório",
          documents: {
            completedCount: 1,
            totalRequiredCount: 4,
            completedTypes: ["dfd"],
            missingTypes: ["etp", "tr", "minuta"],
          },
          listUpdatedAt: "2024-03-27T00:00:00.000Z",
        },
        {
          ...processesListResponse.items[0],
          id: "process-3",
          processNumber: "PE-2024-043",
          title: "Equipamentos de Informática",
          object: "Aquisição de Equipamentos de Informática",
          documents: {
            completedCount: 4,
            totalRequiredCount: 4,
            completedTypes: ["dfd", "etp", "tr", "minuta"],
            missingTypes: [],
          },
          listUpdatedAt: "2024-03-26T00:00:00.000Z",
        },
        {
          ...processesListResponse.items[0],
          id: "process-4",
          processNumber: "PE-2024-042",
          title: "Merenda Escolar",
          object: "Aquisição de Merenda Escolar",
          documents: {
            completedCount: 0,
            totalRequiredCount: 4,
            completedTypes: [],
            missingTypes: ["dfd", "etp", "tr", "minuta"],
          },
          listUpdatedAt: "2024-03-25T00:00:00.000Z",
        },
      ],
      pageSize: 5,
      total: 4,
    };

    server.use(
      http.get("http://localhost:3333/api/processes/", ({ request }) => {
        const url = new URL(request.url);

        requestedParams.push({
          page: url.searchParams.get("page") ?? "",
          pageSize: url.searchParams.get("pageSize") ?? "",
        });

        return HttpResponse.json(homeProcessesResponse);
      }),
    );

    renderHomePage();

    expect(screen.getByRole("heading", { name: "Central de Trabalho" })).toBeInTheDocument();
    expect(
      screen.getByText("Gerencie seus processos de contratação e documentos"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Novo Processo/ })).toHaveAttribute(
      "href",
      "/app/processo/novo",
    );

    expect(screen.getByRole("heading", { name: "Ações Rápidas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar DFD/ })).toHaveAttribute(
      "href",
      "/app/documento/novo?tipo=dfd",
    );
    expect(screen.getByRole("link", { name: /Criar ETP/ })).toHaveAttribute(
      "href",
      "/app/documento/novo?tipo=etp",
    );
    expect(screen.getByRole("link", { name: /Criar TR/ })).toHaveAttribute(
      "href",
      "/app/documento/novo?tipo=tr",
    );
    expect(screen.getByRole("link", { name: /Criar Minuta/ })).toHaveAttribute(
      "href",
      "/app/documento/novo?tipo=minuta",
    );

    expect(screen.getByRole("heading", { name: "Continuar de onde parei" })).toBeInTheDocument();
    const resumeSection = screen
      .getByRole("heading", { name: "Continuar de onde parei" })
      .closest("section");
    expect(resumeSection).not.toBeNull();
    const resume = within(resumeSection as HTMLElement);

    expect(await resume.findByText("Serviços de TI")).toBeInTheDocument();
    expect(resume.getByText("Material de Escritório")).toBeInTheDocument();
    expect(resume.getByText("Equipamentos de Informática")).toBeInTheDocument();
    expect(resume.queryByText("ETP - Serviços de TI")).not.toBeInTheDocument();
    expect(resume.queryByText("TR - Material de Escritório")).not.toBeInTheDocument();
    expect(resume.queryByText("DFD - Equipamentos de Informática")).not.toBeInTheDocument();
    expect(resume.getByText("Processo: PE-2024-045 · 2/4 documentos")).toBeInTheDocument();
    expect(resume.getByLabelText("Progresso do processo PE-2024-045: 50%")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(resume.getByLabelText("Progresso do processo PE-2024-044: 25%")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    expect(resume.getByLabelText("Progresso do processo PE-2024-043: 100%")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(resume.getAllByRole("link", { name: "Continuar" })).toHaveLength(3);
    expect(resume.getAllByRole("link", { name: "Continuar" })[0]).toHaveAttribute(
      "href",
      "/app/processo/process-1",
    );

    expect(await screen.findAllByText("PE-2024-045")).not.toHaveLength(0);
    expect(screen.getAllByText("Serviços de TI")).not.toHaveLength(0);
    expect(screen.getByLabelText("Documentos completos: 2 de 4")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();

    await waitFor(() => {
      expect(requestedParams).toContainEqual({ page: "1", pageSize: "5" });
    });
  });

  it("shows prefeitura management quick actions for organization owners", () => {
    authSessionMock.role = "organization_owner";

    renderHomePage();

    expect(screen.getByRole("heading", { name: "Gestão da Prefeitura" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dados da Prefeitura/ })).toHaveAttribute(
      "href",
      "/app/organizacao?tab=dados",
    );
    expect(screen.getByRole("link", { name: /Convidar membros/ })).toHaveAttribute(
      "href",
      "/app/organizacao?tab=membros",
    );
    expect(screen.getByRole("link", { name: /Departamentos/ })).toHaveAttribute(
      "href",
      "/app/organizacao?tab=departamentos",
    );
    expect(screen.getByRole("link", { name: /Documentos institucionais/ })).toHaveAttribute(
      "href",
      "/app/organizacao?tab=documentos",
    );
    expect(screen.getByRole("link", { name: /Criar DFD/ })).toBeInTheDocument();
  });

  it("hides prefeitura owner actions for members and admins", () => {
    renderHomePage();

    expect(screen.queryByRole("heading", { name: "Gestão da Prefeitura" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Convidar membros/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar DFD/ })).toBeInTheDocument();

    authSessionMock.role = "admin";
    authSessionMock.organizationId = null;
    renderHomePage();

    expect(screen.queryByRole("heading", { name: "Gestão da Prefeitura" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Convidar membros/ })).not.toBeInTheDocument();
  });

  it("shows a process loading state without rendering mock process rows", () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", async () => {
        await new Promise(() => {});
        return HttpResponse.json(processesListResponse);
      }),
    );

    renderHomePage();

    expect(screen.getByRole("table", { name: "Carregando processos" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Carregando processos recentes")).toHaveLength(3);
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();
    expect(screen.queryByText("ETP - Serviços de TI")).not.toBeInTheDocument();
  });

  it("shows a process empty state while preserving the rest of the home page", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 5,
          total: 0,
          totalPages: 0,
        }),
      ),
    );

    renderHomePage();

    expect(await screen.findByText("Nenhum processo recente")).toBeInTheDocument();
    expect(await screen.findByText("Nenhum processo encontrado")).toBeInTheDocument();
    expect(screen.getByText("Criar DFD")).toBeInTheDocument();
    expect(screen.queryByText("ETP - Serviços de TI")).not.toBeInTheDocument();
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();
  });

  it("shows a process error state with retry affordance", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json({ error: "internal_server_error", message: "Falha." }, { status: 500 }),
      ),
    );

    renderHomePage();

    expect(
      await screen.findByText("Não foi possível carregar seus processos recentes"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Não foi possível carregar os processos", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Tentar novamente" })).toHaveLength(2);
    expect(screen.getByText("Criar DFD")).toBeInTheDocument();
    expect(screen.queryByText("ETP - Serviços de TI")).not.toBeInTheDocument();
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();
  });
});
