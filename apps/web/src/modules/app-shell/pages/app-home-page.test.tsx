import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { processesListResponse } from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AppHomePage } from "./app-home-page";

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
  it("renders the validated home layout with quick actions, mocked resume cards, and API processes", async () => {
    const requestedParams: Array<Record<string, string>> = [];

    server.use(
      http.get("http://localhost:3333/api/processes/", ({ request }) => {
        const url = new URL(request.url);

        requestedParams.push({
          page: url.searchParams.get("page") ?? "",
          pageSize: url.searchParams.get("pageSize") ?? "",
        });

        return HttpResponse.json(processesListResponse);
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
    expect(screen.getByText("ETP - Serviços de TI")).toBeInTheDocument();
    expect(screen.getByText("TR - Material de Escritório")).toBeInTheDocument();
    expect(screen.getByText("DFD - Equipamentos de Informática")).toBeInTheDocument();
    expect(screen.getByLabelText("Progresso: 75%")).toBeInTheDocument();

    expect(await screen.findByText("PE-2024-045")).toBeInTheDocument();
    expect(screen.getByText("Serviços de TI")).toBeInTheDocument();
    expect(screen.getByLabelText("Documentos completos: 2 de 4")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();

    await waitFor(() => {
      expect(requestedParams).toContainEqual({ page: "1", pageSize: "5" });
    });
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
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();
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

    expect(await screen.findByText("Nenhum processo encontrado")).toBeInTheDocument();
    expect(screen.getByText("Criar DFD")).toBeInTheDocument();
    expect(screen.getByText("ETP - Serviços de TI")).toBeInTheDocument();
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
      await screen.findByText("Não foi possível carregar os processos", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    expect(screen.getByText("Criar DFD")).toBeInTheDocument();
    expect(screen.getByText("ETP - Serviços de TI")).toBeInTheDocument();
    expect(screen.queryByText("PE-2024-045")).not.toBeInTheDocument();
  });
});
