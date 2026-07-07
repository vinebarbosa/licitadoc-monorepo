import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AdminAiUsagePage } from "./admin-ai-usage-page";

const aiUsageResponse = {
  breakdowns: {
    documentTypes: [
      {
        key: "tr",
        knownCostUsd: 1.12,
        label: "TR",
        runCount: 2,
        shareOfKnownCost: 1,
        totalTokens: 4300,
        unknownCostRunCount: 0,
      },
    ],
    models: [
      {
        key: "gpt-5.4",
        knownCostUsd: 1.12,
        label: "gpt-5.4",
        runCount: 2,
        shareOfKnownCost: 1,
        totalTokens: 4300,
        unknownCostRunCount: 0,
      },
    ],
    organizations: [
      {
        key: "organization-1",
        knownCostUsd: 1.12,
        label: "Prefeitura de Sao Paulo",
        runCount: 2,
        shareOfKnownCost: 1,
        totalTokens: 4300,
        unknownCostRunCount: 0,
      },
    ],
    providers: [
      {
        key: "openai",
        knownCostUsd: 1.12,
        label: "openai",
        runCount: 2,
        shareOfKnownCost: 1,
        totalTokens: 4300,
        unknownCostRunCount: 0,
      },
    ],
    statuses: [
      {
        key: "completed",
        knownCostUsd: 1.12,
        label: "completed",
        runCount: 2,
        shareOfKnownCost: 1,
        totalTokens: 4300,
        unknownCostRunCount: 0,
      },
    ],
  },
  filters: {
    documentType: null,
    from: "2026-04-26T12:00:00.000Z",
    model: null,
    organizationId: null,
    page: 1,
    pageSize: 10,
    providerKey: null,
    sort: "recent",
    status: null,
    to: "2026-05-26T12:00:00.000Z",
  },
  recentRuns: {
    items: [
      {
        callCount: 2,
        costKnown: true,
        costUsd: 0.62,
        documentId: "document-1",
        documentName: "Termo de Referencia",
        documentType: "tr",
        durationMs: 23000,
        errorCode: null,
        errorMessage: null,
        finishedAt: "2026-05-26T10:01:00.000Z",
        id: "run-1",
        model: "gpt-5.4",
        organizationId: "organization-1",
        organizationName: "Prefeitura de Sao Paulo",
        processId: "process-1",
        processLabel: "PROC-2026-001 - Materiais",
        providerKey: "openai",
        startedAt: "2026-05-26T10:00:00.000Z",
        status: "completed",
        totalCachedInputTokens: 1200,
        totalInputTokens: 3000,
        totalOutputTokens: 800,
        totalTokens: 3800,
      },
    ],
    page: 1,
    pageSize: 10,
    total: 2,
    totalPages: 2,
  },
  summary: {
    averageCostPerCompletedDocumentUsd: 0.56,
    cacheInputTokenShare: 0.4,
    completedRunCount: 2,
    failedRunCount: 0,
    failureRate: 0,
    generatedDocumentCount: 2,
    knownCostUsd: 1.12,
    runCount: 2,
    totalCachedInputTokens: 1200,
    totalInputTokens: 3000,
    totalOutputTokens: 1300,
    totalTokens: 4300,
    unknownCostRunCount: 0,
  },
  trend: [
    {
      costUsd: 1.12,
      date: "2026-05-26",
      failedRunCount: 0,
      runCount: 2,
      totalTokens: 4300,
    },
  ],
};

function renderPage(initialEntry = "/admin/ia/uso") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/ia/uso" element={<AdminAiUsagePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminAiUsagePage", () => {
  it("renders AI usage metrics, breakdowns, and run table data", async () => {
    server.use(
      http.get("http://localhost:3333/api/admin/ai-usage/", () =>
        HttpResponse.json(aiUsageResponse),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Custo total")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Uso de IA" })).toBeInTheDocument();
    expect(screen.getAllByText(/US\$/)[0]).toBeInTheDocument();
    expect(screen.getByText("Termo de Referencia")).toBeInTheDocument();
    expect(screen.getAllByText("gpt-5.4").length).toBeGreaterThan(0);
    expect(screen.getByText("Tendencia de custo")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 de 2 execucoes")).toBeInTheDocument();
  });

  it("restores filters from the URL and sends them to the API", async () => {
    const requestedParams: Array<Record<string, string>> = [];

    server.use(
      http.get("http://localhost:3333/api/admin/ai-usage/", ({ request }) => {
        const url = new URL(request.url);

        requestedParams.push({
          documentType: url.searchParams.get("documentType") ?? "",
          model: url.searchParams.get("model") ?? "",
          page: url.searchParams.get("page") ?? "",
          search: url.searchParams.get("search") ?? "",
          sort: url.searchParams.get("sort") ?? "",
          status: url.searchParams.get("status") ?? "",
        });

        return HttpResponse.json(aiUsageResponse);
      }),
    );

    renderPage(
      "/admin/ia/uso?page=2&model=gpt-5.4&documentType=tr&status=completed&sort=cost_desc&search=licitacao",
    );

    await waitFor(() => {
      expect(requestedParams).toContainEqual({
        documentType: "tr",
        model: "gpt-5.4",
        page: "2",
        search: "licitacao",
        sort: "cost_desc",
        status: "completed",
      });
    });
  });

  it("requests the next table page without losing filters", async () => {
    const requestedPages: string[] = [];

    server.use(
      http.get("http://localhost:3333/api/admin/ai-usage/", ({ request }) => {
        const url = new URL(request.url);
        requestedPages.push(url.searchParams.get("page") ?? "1");

        return HttpResponse.json(aiUsageResponse);
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Termo de Referencia")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Proxima" }));

    await waitFor(() => {
      expect(requestedPages).toContain("2");
    });
  });

  it("renders an empty state when no usage is returned", async () => {
    server.use(
      http.get("http://localhost:3333/api/admin/ai-usage/", () =>
        HttpResponse.json({
          ...aiUsageResponse,
          recentRuns: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
          summary: {
            ...aiUsageResponse.summary,
            completedRunCount: 0,
            generatedDocumentCount: 0,
            knownCostUsd: 0,
            runCount: 0,
            totalCachedInputTokens: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
          },
          trend: [],
        }),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Nenhum uso de IA encontrado")).toBeInTheDocument();
    });
  });

  it("renders an error state with retry affordance", async () => {
    server.use(
      http.get("http://localhost:3333/api/admin/ai-usage/", () =>
        HttpResponse.json({ message: "Erro" }, { status: 500 }),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Nao foi possivel carregar o uso de IA")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
