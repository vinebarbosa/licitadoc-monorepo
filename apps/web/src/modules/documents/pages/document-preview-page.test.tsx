import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentPreviewPage } from "@/modules/documents";
import {
  documentDetailResponse,
  emptyDocumentDetailResponse,
  failedDocumentDetailResponse,
  generatingDocumentDetailResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

class MockEventSource {
  static instances: MockEventSource[] = [];

  closed = false;
  listeners = new Map<string, Array<(event: MessageEvent) => void>>();
  onerror: ((event: Event) => void) | null = null;
  url: string;
  withCredentials: boolean;

  constructor(url: string, init?: EventSourceInit) {
    this.url = url;
    this.withCredentials = init?.withCredentials ?? false;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const listeners = this.listeners.get(type) ?? [];
    const callback =
      typeof listener === "function"
        ? (event: MessageEvent) => listener(event)
        : (event: MessageEvent) => listener.handleEvent(event);

    listeners.push(callback);
    this.listeners.set(type, listeners);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown) {
    const event = new MessageEvent(type, {
      data: JSON.stringify(data),
    });

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  emitError() {
    this.onerror?.(new Event("error"));
  }
}

function renderDocumentPreviewPage(
  options:
    | string
    | {
        initialEntries?: string[];
        initialIndex?: number;
      } = {},
) {
  const { initialEntries = ["/app/documento/document-1/preview"], initialIndex } =
    typeof options === "string" ? { initialEntries: [options] } : options;

  return renderWithProviders(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/app/documento/:documentId/preview" element={<DocumentPreviewPage />} />
        <Route path="/app/documentos" element={<div>Documentos</div>} />
        <Route path="/app/processo/:processId" element={<div>Processo vinculado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  MockEventSource.instances = [];
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.info).mockReset();
  vi.stubGlobal("EventSource", MockEventSource);
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", window.location.href);
});

function expectPreviewActions(documentId: string) {
  expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Voltar para documentos/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Voltar para edição/ })).not.toBeInTheDocument();
  expect(document.querySelector(`a[href="/app/documento/${documentId}"]`)).toBeNull();
  expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Exportar DOCX" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeInTheDocument();
}

function setScrollMetrics(
  element: HTMLElement,
  metrics: { clientHeight: number; scrollHeight: number; scrollTop: number },
) {
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    value: metrics.scrollTop,
    writable: true,
  });
}

function mockDocumentTextSelection(selectedText: string, container: HTMLElement) {
  return vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 1,
    toString: () => selectedText,
    getRangeAt: () =>
      ({
        commonAncestorContainer: container,
        getBoundingClientRect: () =>
          ({
            bottom: 220,
            height: 20,
            left: 320,
            right: 520,
            top: 200,
            width: 200,
            x: 320,
            y: 200,
            toJSON: () => ({}),
          }) as DOMRect,
      }) as unknown as Range,
  } as unknown as Selection);
}

describe("DocumentPreviewPage", () => {
  it("renders completed document metadata, validated actions, and stored content", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(documentDetailResponse),
      ),
    );

    renderDocumentPreviewPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
    });

    const sheet = screen.getByTestId("document-preview-sheet");
    expect(sheet).toBeInTheDocument();
    expect(sheet).toHaveAttribute("data-institutional-document-output");
    expect(sheet).toHaveAttribute("data-institutional-document-no-branding", "true");
    expect(sheet).toHaveAttribute("data-institutional-document-sheet");
    expect(screen.getByTestId("document-preview-scroll-container")).toHaveAttribute(
      "data-institutional-document-preview-root",
    );
    expect(document.querySelector("[data-institutional-logo]")).toBeNull();
    expect(document.querySelector("[data-institutional-coat-of-arms]")).toBeNull();
    expect(document.querySelector("[data-institutional-watermark]")).toBeNull();
    expect(document.querySelector("[data-institutional-decorative-band]")).toBeNull();
    expect(screen.queryByText("Órgão não informado")).not.toBeInTheDocument();
    expect(screen.queryByText("Unidade requisitante não informada")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "OBJETO" })).not.toBeInTheDocument();
    expect(screen.queryByText("Responsável pelo documento")).not.toBeInTheDocument();
    expectPreviewActions("document-1");
    expect(
      screen.getByRole("button", { name: "Voltar" }).closest("[data-document-preview-actions]"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Exportar DOCX" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeEnabled();
    expect(screen.getByText(/Processo:/)).toBeInTheDocument();
    expect(screen.getByText(/Contratacao de Servicos de TI/)).toBeInTheDocument();
  });

  it("shows a floating prompt for selected document text and applies an accepted suggestion", async () => {
    const selectedText = "Contratacao de Servicos de TI para suporte tecnico especializado.";
    const replacementText =
      "Contratação de serviços de TI para suporte técnico especializado, em linguagem formal.";
    const updatedDraftContent = documentDetailResponse.draftContent.replace(
      selectedText,
      replacementText,
    );
    const sourceTarget = {
      start: documentDetailResponse.draftContent.indexOf(selectedText),
      end: documentDetailResponse.draftContent.indexOf(selectedText) + selectedText.length,
      sourceText: selectedText,
    };

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(documentDetailResponse),
      ),
      http.post(
        "http://localhost:3333/api/documents/:documentId/adjustments/suggestions",
        async ({ request }) => {
          const body = (await request.json()) as {
            instruction: string;
            selectedText: string;
            selectionContext?: { prefix?: string; suffix?: string };
          };

          expect(body.selectedText).toBe(selectedText);
          expect(body.instruction).toBe("deixe mais formal");
          expect(body.selectionContext?.prefix).toContain("## 1. Objeto");

          return HttpResponse.json({
            selectedText,
            replacementText,
            sourceContentHash: "sha256:current",
            sourceTarget,
          });
        },
      ),
      http.post(
        "http://localhost:3333/api/documents/:documentId/adjustments/apply",
        async ({ request }) => {
          const body = (await request.json()) as {
            replacementText: string;
            sourceContentHash: string;
            sourceTarget: { start: number; end: number; sourceText: string };
          };

          expect(body.sourceTarget).toEqual(sourceTarget);
          expect(body.replacementText).toBe(replacementText);
          expect(body.sourceContentHash).toBe("sha256:current");

          return HttpResponse.json({
            ...documentDetailResponse,
            draftContent: updatedDraftContent,
          });
        },
      ),
    );

    renderDocumentPreviewPage();

    const sheet = await screen.findByTestId("document-preview-sheet");
    const documentBody = sheet.querySelector("[data-document-body]");
    expect(documentBody).not.toBeNull();
    const selectionSpy = mockDocumentTextSelection(selectedText, documentBody as HTMLElement);

    fireEvent.mouseUp(sheet);

    expect(await screen.findByText("Ajustar texto")).toBeInTheDocument();

    const instructionInput = screen.getByPlaceholderText(
      "Ex.: deixe mais objetivo, mantendo o tom formal",
    );
    selectionSpy.mockReturnValue({
      rangeCount: 0,
      toString: () => "",
      getRangeAt: () => {
        throw new Error("Selection range is not available.");
      },
    } as unknown as Selection);
    fireEvent.focus(instructionInput);
    fireEvent.change(instructionInput, {
      target: { value: "deixe mais formal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gerar ajuste" }));

    expect(await screen.findByText(replacementText)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));

    expect(screen.queryByText(replacementText)).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Ex.: deixe mais objetivo, mantendo o tom formal"),
      {
        target: { value: "deixe mais formal" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Gerar ajuste" }));

    expect(await screen.findByText(replacementText)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => {
      expect(screen.queryByText("Ajustar texto")).not.toBeInTheDocument();
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("does not show the text adjustment prompt for generating documents", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    const stateCard = await screen.findByText("Preview em geração");
    mockDocumentTextSelection("Conteudo", stateCard);

    fireEvent.mouseUp(stateCard);

    expect(screen.queryByText("Ajustar texto")).not.toBeInTheDocument();
  });

  it("uses browser history when the back action has a previous in-app entry", async () => {
    window.history.replaceState({ idx: 1 }, "", window.location.href);
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(documentDetailResponse),
      ),
    );

    renderDocumentPreviewPage({
      initialEntries: ["/app/processo/process-1", "/app/documento/document-1/preview"],
      initialIndex: 1,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByText("Processo vinculado")).toBeInTheDocument();
    expect(screen.queryByText("Documentos")).not.toBeInTheDocument();
  });

  it("falls back to the documents page when the back action has no usable history", async () => {
    window.history.replaceState({ idx: 0 }, "", window.location.href);
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(documentDetailResponse),
      ),
    );

    renderDocumentPreviewPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(await screen.findByText("Documentos")).toBeInTheDocument();
    expect(document.querySelector('a[href="/app/documento/document-1"]')).toBeNull();
  });

  it("renders institutional administrative fields, list emphasis, and signature markers", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContent: `# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)

## 1. DADOS DA SOLICITACAO

- Unidade Orcamentaria: 06.001 - Secretaria Municipal de Educacao
- Numero da Solicitacao: 6
- Data de Emissao: 08/01/2026
- Processo: Servico
- Objeto: Contratacao de apresentacao artistica
- **Critério principal:** atendimento ao interesse publico.

## 6. FECHO

Pureza/RN, 08 de janeiro de 2026.

Maria Costa

Secretaria Municipal`,
        }),
      ),
    );

    renderDocumentPreviewPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 2, name: /1\. DADOS DA SOLICITACAO/ })).toHaveClass(
      "institutional-document-section-title",
    );
    expect(screen.getByRole("heading", { level: 2, name: /6\. FECHO/ })).toHaveAttribute(
      "data-institutional-signature-heading",
      "true",
    );
    expect(screen.getByText("Unidade Orcamentaria:").closest("li")).toHaveAttribute(
      "data-institutional-administrative-field",
    );
    expect(screen.getByText("Unidade Orcamentaria:")).toHaveClass(
      "institutional-document-field-label",
    );
    expect(screen.getByText("06.001 - Secretaria Municipal de Educacao")).not.toHaveClass(
      "font-semibold",
    );
    expect(screen.getByText("Critério principal:")).toHaveClass("font-semibold");
    expect(screen.getByText("Pureza/RN, 08 de janeiro de 2026.")).toHaveClass(
      "institutional-document-paragraph",
    );
    expect(screen.getByText("Maria Costa")).toHaveClass("institutional-document-paragraph");
  });

  it.each([
    ["etp", "# ESTUDO TECNICO PRELIMINAR\n\nConteudo do ETP."],
    ["tr", "# TERMO DE REFERENCIA\n\nConteudo do TR."],
    ["minuta", "# MINUTA DO CONTRATO\n\nConteudo da minuta."],
  ])("reuses the institutional theme for %s previews", async (type, draftContent) => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          type,
          draftContent,
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(await screen.findByTestId("document-preview-sheet")).toHaveAttribute(
      "data-institutional-document-output",
    );
    expect(document.querySelector("[data-institutional-document-output]")).toBeInTheDocument();
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
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
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
    expectPreviewActions("document-2");
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar DOCX" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeDisabled();
    expect(screen.queryByRole("heading", { name: "ETP - PE-2024-045" })).not.toBeInTheDocument();
    expect(screen.queryByText("Preview do Documento")).not.toBeInTheDocument();
  });

  it("renders planning progress separately before document text is available", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    act(() => {
      MockEventSource.instances[0]?.emit("planning", {
        type: "planning",
        documentId: "document-2",
        planningDelta: "Analisando requisitos internos e justificativas detalhadas",
        planningContent: "Analisando requisitos internos e justificativas detalhadas",
        status: "generating",
      });
    });

    expect(screen.getByText("Preparando documento")).toBeInTheDocument();
    expect(screen.getByText("Recebendo contexto do processo")).toBeInTheDocument();
    expect(screen.getByText("Identificando tipo e finalidade")).toBeInTheDocument();
    expect(screen.getByText("Lendo dados da solicitação")).toBeInTheDocument();
    expect(screen.getByText("Finalizando geração")).toBeInTheDocument();
    expect(screen.getByTestId("planning-stepper-viewport")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText(/A IA está analisando o processo/)).toBeInTheDocument();
    expect(screen.queryByText("Raciocínio da IA")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Analisando requisitos internos e justificativas detalhadas"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /raciocínio|pensamento|detalhes/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Gerando documento em tempo real")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar DOCX" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeDisabled();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("updates planning stepper states as planning progress advances", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    const longPlanningContent = "planejamento detalhado ".repeat(45);

    act(() => {
      MockEventSource.instances[0]?.emit("planning", {
        type: "planning",
        documentId: "document-2",
        planningDelta: longPlanningContent,
        planningContent: longPlanningContent,
        status: "generating",
      });
    });

    expect(screen.getByText("Recebendo contexto do processo").closest("li")).toHaveAttribute(
      "data-state",
      "complete",
    );
    expect(screen.getByText("Organizando seções obrigatórias").closest("li")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByText("Redigindo conteúdo técnico").closest("li")).toHaveAttribute(
      "data-state",
      "pending",
    );
    expect(screen.getByText("Agora")).toBeInTheDocument();
    expect(screen.getAllByText("Concluído").length).toBeGreaterThan(0);
    expect(screen.getAllByText("A seguir").length).toBeGreaterThan(0);
  });

  it("uses non-smooth auto-scroll when reduced motion is preferred", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    act(() => {
      MockEventSource.instances[0]?.emit("planning", {
        type: "planning",
        documentId: "document-2",
        planningDelta: "Planejamento inicial",
        planningContent: "Planejamento inicial",
        status: "generating",
      });
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    });
  });

  it("renders live partial content from the document generation stream", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    expect(MockEventSource.instances[0]?.url).toBe(
      "http://localhost:3333/api/documents/document-2/events",
    );
    expect(MockEventSource.instances[0]?.withCredentials).toBe(true);

    vi.useFakeTimers();

    act(() => {
      MockEventSource.instances[0]?.emit("planning", {
        type: "planning",
        documentId: "document-2",
        planningDelta: "Planejando estrutura interna com criterios longos de avaliacao",
        planningContent: "Planejando estrutura interna com criterios longos de avaliacao",
        status: "generating",
      });
    });
    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "# Parcial\n\n",
        content: "# Parcial\n\n",
        status: "generating",
      });
    });
    act(() => {
      vi.advanceTimersByTime(24);
    });
    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "Objeto parcial.",
        content: "# Parcial\n\nObjeto parcial.",
        status: "generating",
      });
    });
    act(() => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.getByText("Preparando documento")).toBeInTheDocument();
    expect(screen.getByText("Redigindo conteúdo técnico").closest("li")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(
      screen.queryByText("Planejando estrutura interna com criterios longos de avaliacao"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Raciocínio da IA")).not.toBeInTheDocument();
    expect(screen.getByText("Gerando documento em tempo real")).toBeInTheDocument();
    expect(screen.getByTestId("document-preview-sheet")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Parcial" })).toBeInTheDocument();
    expect(screen.getByText(/Objeto parcial/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Planejando estrutura interna com criterios longos de avaliacao/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar DOCX" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeDisabled();
  });

  it("auto-follows the live writing endpoint as visible document content grows", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    vi.useFakeTimers();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "# Parcial\n\nConteudo inicial.",
        content: "# Parcial\n\nConteudo inicial.",
        status: "generating",
      });
      vi.advanceTimersByTime(240);
    });

    expect(screen.getByTestId("live-writing-endpoint")).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "end",
    });
  });

  it("pauses and resumes live writing auto-follow based on user scroll position", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    vi.useFakeTimers();

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "# Parcial\n\nPrimeiro trecho.",
        content: "# Parcial\n\nPrimeiro trecho.",
        status: "generating",
      });
      vi.advanceTimersByTime(240);
    });

    const scrollContainer = screen.getByTestId("document-preview-scroll-container");
    setScrollMetrics(scrollContainer, {
      clientHeight: 600,
      scrollHeight: 2000,
      scrollTop: 200,
    });

    act(() => {
      fireEvent.scroll(scrollContainer);
    });

    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: " Segundo trecho.",
        content: "# Parcial\n\nPrimeiro trecho. Segundo trecho.",
        status: "generating",
      });
      vi.advanceTimersByTime(240);
    });

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalledWith({
      behavior: "smooth",
      block: "end",
    });

    setScrollMetrics(scrollContainer, {
      clientHeight: 600,
      scrollHeight: 2000,
      scrollTop: 1260,
    });

    act(() => {
      fireEvent.scroll(scrollContainer);
    });

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: " Terceiro trecho.",
        content: "# Parcial\n\nPrimeiro trecho. Segundo trecho. Terceiro trecho.",
        status: "generating",
      });
      vi.advanceTimersByTime(240);
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "end",
    });
  });

  it("uses non-smooth auto-follow for live writing when reduced motion is preferred", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    vi.useFakeTimers();
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "# Parcial\n\nConteudo inicial.",
        content: "# Parcial\n\nConteudo inicial.",
        status: "generating",
      });
      vi.advanceTimersByTime(240);
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "end",
    });
  });

  it("smooths burst chunks into progressive visible writing", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    vi.useFakeTimers();

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "Primeiro ",
        content: "Primeiro ",
        status: "generating",
      });
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "segundo ",
        content: "Primeiro segundo ",
        status: "generating",
      });
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "terceiro.",
        content: "Primeiro segundo terceiro.",
        status: "generating",
      });
    });

    expect(screen.queryByText(/terceiro/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(24);
    });

    expect(screen.getByText(/Primeiro seg/)).toBeInTheDocument();
    expect(screen.queryByText(/terceiro/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(240);
    });

    expect(screen.getByText(/Primeiro segundo terceiro\./)).toBeInTheDocument();
  });

  it("reconciles stream snapshots without duplicating already visible text", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    vi.useFakeTimers();

    act(() => {
      MockEventSource.instances[0]?.emit("chunk", {
        type: "chunk",
        documentId: "document-2",
        textDelta: "Parte ",
        content: "Parte ",
        status: "generating",
      });
      vi.advanceTimersByTime(120);
    });

    expect(screen.getByText("Parte")).toBeInTheDocument();

    act(() => {
      MockEventSource.instances[0]?.emit("snapshot", {
        type: "snapshot",
        documentId: "document-2",
        content: "Parte final",
        status: "generating",
      });
      vi.advanceTimersByTime(120);
    });

    expect(screen.getByText("Parte final")).toBeInTheDocument();
    expect(screen.queryByText(/Parte Parte/)).not.toBeInTheDocument();
  });

  it("refetches persisted detail after generation completion event", async () => {
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
          draftContent: "# ESTUDO TECNICO PRELIMINAR\n\nConteudo persistido.",
        });
      }),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    act(() => {
      MockEventSource.instances[0]?.emit("completed", {
        type: "completed",
        documentId: "document-2",
        content: "# Parcial",
        status: "completed",
      });
    });

    expect(await screen.findByText(/Conteudo persistido/)).toBeInTheDocument();
    expect(MockEventSource.instances[0]?.closed).toBe(true);
    expect(requests).toBeGreaterThanOrEqual(2);
  });

  it("refetches failed detail after generation failure event", async () => {
    let requests = 0;

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(generatingDocumentDetailResponse);
        }

        return HttpResponse.json(failedDocumentDetailResponse);
      }),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    act(() => {
      MockEventSource.instances[0]?.emit("failed", {
        type: "failed",
        documentId: "document-2",
        errorCode: "provider_unavailable",
        errorMessage: "Provider indisponivel.",
        status: "failed",
      });
    });

    expect(await screen.findByText("Geração do documento falhou")).toBeInTheDocument();
    expect(MockEventSource.instances[0]?.closed).toBe(true);
  });

  it("keeps polling fallback when the realtime stream fails", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    act(() => {
      MockEventSource.instances[0]?.emitError();
    });

    expect(
      await screen.findByText(/acompanhamento em tempo real não está disponível/i),
    ).toBeInTheDocument();
    expect(MockEventSource.instances[0]?.closed).toBe(true);
  });

  it("closes the realtime subscription when leaving the preview page", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(generatingDocumentDetailResponse),
      ),
    );

    const view = renderDocumentPreviewPage("/app/documento/document-2/preview");

    expect(await screen.findByText("Preview em geração")).toBeInTheDocument();

    await waitFor(() => {
      expect(MockEventSource.instances).toHaveLength(1);
    });

    view.unmount();

    expect(MockEventSource.instances[0]?.closed).toBe(true);
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
    expectPreviewActions("document-3");
    expect(screen.queryByRole("heading", { name: "Minuta - PE-2024-043" })).not.toBeInTheDocument();
  });

  it("shows empty content state for completed documents without draft content", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(emptyDocumentDetailResponse),
      ),
    );

    renderDocumentPreviewPage("/app/documento/document-empty/preview");

    expect(await screen.findByText("Documento sem conteúdo")).toBeInTheDocument();
    expectPreviewActions("document-empty");
    expect(screen.queryByRole("heading", { name: "TR - PE-2024-045" })).not.toBeInTheDocument();
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
        expect(
          screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
        ).toBeInTheDocument();
      });

      // Heading levels
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /1\. Objeto/ })).toBeInTheDocument();

      // Strong emphasis
      expect(screen.getAllByText(/Processo:/).length).toBeGreaterThan(0);

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
        expect(screen.getByRole("heading", { level: 1, name: "Titulo" })).toBeInTheDocument();
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
        expect(screen.getByRole("heading", { level: 1, name: "Titulo" })).toBeInTheDocument();
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

  describe("document text adjustment error and success flows", () => {
    const selectedText = "Contratacao de Servicos de TI para suporte tecnico especializado.";
    const replacementText = "Texto substituto para fins de teste.";
    const sourceTarget = {
      start: documentDetailResponse.draftContent.indexOf(selectedText),
      end: documentDetailResponse.draftContent.indexOf(selectedText) + selectedText.length,
      sourceText: selectedText,
    };

    function setupDocumentAndSuggestion() {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json(documentDetailResponse),
        ),
        http.post("http://localhost:3333/api/documents/:documentId/adjustments/suggestions", () =>
          HttpResponse.json({
            selectedText,
            replacementText,
            sourceContentHash: "sha256:current",
            sourceTarget,
          }),
        ),
      );
    }

    async function renderAndOpenAdjustmentPanel() {
      renderDocumentPreviewPage();

      const sheet = await screen.findByTestId("document-preview-sheet");
      const documentBody = sheet.querySelector("[data-document-body]");
      expect(documentBody).not.toBeNull();
      mockDocumentTextSelection(selectedText, documentBody as HTMLElement);

      fireEvent.mouseUp(sheet);
      expect(await screen.findByText("Ajustar texto")).toBeInTheDocument();

      fireEvent.change(
        screen.getByPlaceholderText("Ex.: deixe mais objetivo, mantendo o tom formal"),
        { target: { value: "reformule" } },
      );
      fireEvent.click(screen.getByRole("button", { name: "Gerar ajuste" }));

      expect(await screen.findByText(replacementText)).toBeInTheDocument();
    }

    it("4.4 apply 409 conflict shows error message, keeps panel open, and does not call success toast", async () => {
      setupDocumentAndSuggestion();
      server.use(
        http.post("http://localhost:3333/api/documents/:documentId/adjustments/apply", () =>
          HttpResponse.json(
            { message: "Conteúdo do documento foi alterado após a sugestão." },
            { status: 409 },
          ),
        ),
      );

      await renderAndOpenAdjustmentPanel();

      fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

      await waitFor(() => {
        expect(
          screen.getByText("Conteúdo do documento foi alterado após a sugestão."),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Ajustar texto")).toBeInTheDocument();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("4.5 successful apply updates the visible preview from the returned persisted draft content", async () => {
      const updatedDraftContent = documentDetailResponse.draftContent.replace(
        selectedText,
        replacementText,
      );

      setupDocumentAndSuggestion();
      server.use(
        http.post("http://localhost:3333/api/documents/:documentId/adjustments/apply", () =>
          HttpResponse.json({
            ...documentDetailResponse,
            draftContent: updatedDraftContent,
          }),
        ),
      );

      await renderAndOpenAdjustmentPanel();

      fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

      await waitFor(() => {
        expect(screen.queryByText("Ajustar texto")).not.toBeInTheDocument();
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(screen.getByText(replacementText)).toBeInTheDocument();
    });
  });
});
