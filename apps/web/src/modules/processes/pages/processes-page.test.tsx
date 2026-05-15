import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProcessesPage } from "@/modules/processes";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

const processesResponse = {
  items: [
    {
      id: "process-1",
      organizationId: "organization-1",
      type: "pregao-eletronico",
      procurementMethod: "pregao-eletronico",
      processNumber: "PE-2024-045",
      externalId: null,
      issuedAt: "2024-03-01T00:00:00.000Z",
      title: "Serviços de TI",
      object: "Contratação de Serviços de TI",
      justification: "Necessidade de suporte técnico especializado.",
      responsibleName: "Maria Costa",
      status: "em_edicao",
      sourceKind: null,
      sourceReference: null,
      sourceMetadata: null,
      departmentIds: ["department-1"],
      createdAt: "2024-03-01T00:00:00.000Z",
      updatedAt: "2024-03-28T00:00:00.000Z",
      documents: {
        completedCount: 2,
        totalRequiredCount: 4,
        completedTypes: ["dfd", "etp"],
        missingTypes: ["tr", "minuta"],
      },
      listUpdatedAt: "2024-03-28T00:00:00.000Z",
    },
  ],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
};

function renderProcessesPage(initialEntry = "/app/processos") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/processos" element={<ProcessesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProcessesPage", () => {
  it("renders the validated listing layout with API-backed process rows", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () => HttpResponse.json(processesResponse)),
    );

    renderProcessesPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Processos de Contratação" })).toBeInTheDocument();
    });

    expect(screen.getByText("Gerencie todos os processos de contratação")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Novo Processo/ })).toHaveAttribute(
      "href",
      "/app/processo/novo",
    );
    expect(await screen.findByText("PE-2024-045")).toBeInTheDocument();
    expect(screen.getByText("Serviços de TI")).toBeInTheDocument();
    expect(screen.queryByText("Contratação de Serviços de TI")).not.toBeInTheDocument();
    expect(screen.getByText("Em edição")).toBeInTheDocument();
    expect(screen.getByText("Pregão Eletrônico")).toBeInTheDocument();
    expect(screen.getByText("Maria Costa")).toBeInTheDocument();
    expect(screen.getByLabelText("Documentos completos: 2 de 4")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 de 1 processos")).toBeInTheDocument();
  });

  it("restores filters from URL and requests matching API query params", async () => {
    const requestedParams: Array<Record<string, string>> = [];

    server.use(
      http.get("http://localhost:3333/api/processes/", ({ request }) => {
        const url = new URL(request.url);

        requestedParams.push({
          page: url.searchParams.get("page") ?? "",
          pageSize: url.searchParams.get("pageSize") ?? "",
          search: url.searchParams.get("search") ?? "",
          status: url.searchParams.get("status") ?? "",
          procurementMethod: url.searchParams.get("procurementMethod") ?? "",
        });

        return HttpResponse.json(processesResponse);
      }),
    );

    renderProcessesPage(
      "/app/processos?page=2&search=servicos&status=em_edicao&type=pregao-eletronico",
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("servicos")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(requestedParams).toContainEqual({
        page: "2",
        pageSize: "10",
        search: "servicos",
        status: "em_edicao",
        procurementMethod: "pregao-eletronico",
      });
    });
  });

  it("updates URL-backed search and sends the new query params", async () => {
    const requestedSearches: string[] = [];

    server.use(
      http.get("http://localhost:3333/api/processes/", ({ request }) => {
        const url = new URL(request.url);

        requestedSearches.push(url.searchParams.get("search") ?? "");

        return HttpResponse.json(processesResponse);
      }),
    );

    renderProcessesPage();

    await waitFor(() => {
      expect(screen.getByText("PE-2024-045")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Buscar processos"), {
      target: { value: "limpeza" },
    });

    await waitFor(() => {
      expect(requestedSearches).toContain("limpeza");
    });
  });

  it("renders empty and error states without mock rows", async () => {
    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        }),
      ),
    );

    const { unmount } = renderProcessesPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum processo encontrado")).toBeInTheDocument();
    });
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();

    unmount();

    server.use(
      http.get("http://localhost:3333/api/processes/", () =>
        HttpResponse.json(
          { error: "server_error", message: "Falha", details: null },
          { status: 500 },
        ),
      ),
    );

    renderProcessesPage();

    expect(
      await screen.findByText("Não foi possível carregar os processos", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeInTheDocument();
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();
  });
});
