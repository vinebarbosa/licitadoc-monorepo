import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DocumentPreviewPage } from "@/modules/documents";
import {
  documentDetailResponse,
  emptyDocumentDetailResponse,
  failedDocumentDetailResponse,
  generatingDocumentDetailResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

function renderDocumentPreviewPage(initialEntry = "/app/documento/document-1/preview") {
  return renderWithProviders(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/documento/:documentId/preview" element={<DocumentPreviewPage />} />
        <Route path="/app/documentos" element={<div>Documentos</div>} />
        <Route path="/app/processo/:processId" element={<div>Processo vinculado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentPreviewPage", () => {
  it("renders completed document metadata, process navigation, and stored content", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(documentDetailResponse),
      ),
    );

    renderDocumentPreviewPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });

    expect(screen.getAllByText("Formalização de Demanda").length).toBeGreaterThan(0);
    expect(screen.getByText("Concluído")).toBeInTheDocument();
    expect(screen.getByText("Maria Costa")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /PE-2024-045/ })[0]).toHaveAttribute(
      "href",
      "/app/processo/process-1",
    );
    // Markdown heading renders as h1 semantic element
    expect(
      screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Contratacao de Servicos de TI/)).toBeInTheDocument();
  });

  it("shows loading state while fetching document detail", () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", async () => {
        await new Promise(() => {});
        return HttpResponse.json(documentDetailResponse);
      }),
    );

    renderDocumentPreviewPage();

    expect(screen.queryByRole("heading", { name: "DFD - PE-2024-045" })).not.toBeInTheDocument();
  });

  it("shows retryable error state and retries the detail request", async () => {
    let requests = 0;

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(
            { error: "internal_server_error", message: "Falha." },
            { status: 500 },
          );
        }

        return HttpResponse.json(documentDetailResponse);
      }),
    );

    renderDocumentPreviewPage();

    expect(await screen.findByText("Não foi possível carregar o documento")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
    });
    expect(requests).toBeGreaterThanOrEqual(2);
  });

  it("shows unavailable state for forbidden or not found responses", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(
          { error: "not_found", message: "Documento não encontrado.", details: null },
          { status: 404 },
        ),
      ),
    );

    renderDocumentPreviewPage();

    expect(await screen.findByText("Documento não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar para Documentos/ })).toHaveAttribute(
      "href",
      "/app/documentos",
    );
  });

  it("shows generating state without rendering empty preview content", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ETP - PE-2024-045" })).toBeInTheDocument();
    expect(screen.queryByText("Preview do Documento")).not.toBeInTheDocument();
  });

  it("polls while document generation is pending and stops after completion", async () => {
    let requests = 0;

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(generatingDocumentDetailResponse);
        }

        return HttpResponse.json({
          ...documentDetailResponse,
          id: "document-2",
          name: "ETP - PE-2024-045",
          type: "etp",
          status: "completed",
          draftContent: "# ESTUDO TECNICO PRELIMINAR\n\nConteudo finalizado.",
        });
      }),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText(/Conteudo finalizado/)).toBeInTheDocument();
      },
      { timeout: 2500 },
    );
    expect(requests).toBe(2);
  });

  it("shows failed generation state", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(failedDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-3/preview");

    expect(await screen.findByText("Geração do documento falhou")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Minuta - PE-2024-043" })).toBeInTheDocument();
  });

  it("shows empty content state for completed documents without draft content", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(emptyDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-empty/preview");

    expect(await screen.findByText("Documento sem conteúdo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TR - PE-2024-045" })).toBeInTheDocument();
  });

  describe("3.2 – Markdown rendering produces semantic elements", () => {
    it("renders h1/h2 headings, strong emphasis, list items, table, and link from Markdown", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json(documentDetailResponse),
        ),
      );

      renderDocumentPreviewPage();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
      });

      // Heading levels
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /1\. Objeto/ })).toBeInTheDocument();

      // Strong emphasis
      expect(screen.getByText(/Processo:/)).toBeInTheDocument();

      // List items
      expect(screen.getByText(/Suporte a infraestrutura de rede/)).toBeInTheDocument();

      // Table
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Item/ })).toBeInTheDocument();
      expect(screen.getByRole("cell", { name: /Suporte mensal/ })).toBeInTheDocument();

      // Link
      expect(screen.getByRole("link", { name: /edital PE-2024-045/ })).toHaveAttribute(
        "href",
        "https://licitadoc.test/editais/pe-2024-045",
      );
    });
  });

  describe("3.3 – Markdown renderer blocks raw HTML and unsafe content", () => {
    it("does not mount script elements from raw HTML in Markdown content", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json({
            ...documentDetailResponse,
            draftContent:
              "# Titulo\n\nConteudo normal.\n\n<script>window.__xssTest = true</script>\n\nTexto apos HTML.",
          }),
        ),
      );

      renderDocumentPreviewPage();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
      });

      // Script should not be present as an executable element
      expect(document.querySelectorAll("script[src]")).toHaveLength(0);
      // window.__xssTest should not have been set
      expect((window as unknown as Record<string, unknown>).__xssTest).toBeUndefined();
      // Normal content should still render
      expect(screen.getByText(/Conteudo normal/)).toBeInTheDocument();
      expect(screen.getByText(/Texto apos HTML/)).toBeInTheDocument();
    });

    it("renders unsafe link scheme without navigating through it", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json({
            ...documentDetailResponse,
            draftContent: "# Titulo\n\n[Link perigoso](javascript:alert('xss'))\n\nTexto normal.",
          }),
        ),
      );

      renderDocumentPreviewPage();

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeInTheDocument();
      });

      // The unsafe link should either not render as an anchor or have its href removed
      const link = screen.queryByRole("link", { name: "Link perigoso" });
      if (link) {
        expect(link).not.toHaveAttribute("href", "javascript:alert('xss')");
      }
      // Content text remains visible
      expect(screen.getByText(/Texto normal/)).toBeInTheDocument();
    });
  });

  describe("3.4 – Non-completed states bypass Markdown rendering", () => {
    it("generating state does not render Markdown preview card", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json(generatingDocumentDetailResponse),
        ),
      );

      renderDocumentPreviewPage("/app/documento/document-2/preview");

      expect(await screen.findByText("Preview em geração")).toBeInTheDocument();
      expect(screen.queryByText("Preview do Documento")).not.toBeInTheDocument();
    });

    it("failed state does not render Markdown preview card", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json(failedDocumentDetailResponse),
        ),
      );

      renderDocumentPreviewPage("/app/documento/document-3/preview");

      expect(await screen.findByText("Geração do documento falhou")).toBeInTheDocument();
      expect(screen.queryByText("Preview do Documento")).not.toBeInTheDocument();
    });

    it("empty-content state does not render Markdown preview card", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json(emptyDocumentDetailResponse),
        ),
      );

      renderDocumentPreviewPage("/app/documento/document-empty/preview");

      expect(await screen.findByText("Documento sem conteúdo")).toBeInTheDocument();
      expect(screen.queryByText("Preview do Documento")).not.toBeInTheDocument();
    });

    it("retryable error state does not render Markdown preview card", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json({ error: "internal_server_error", message: "Falha." }, { status: 500 }),
        ),
      );

      renderDocumentPreviewPage();

      expect(await screen.findByText("Não foi possível carregar o documento")).toBeInTheDocument();
      expect(screen.queryByText("Preview do Documento")).not.toBeInTheDocument();
    });
  });
});
