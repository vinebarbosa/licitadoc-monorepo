import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { exportPagedPreviewToPdfMock, toastErrorMock } = vi.hoisted(() => ({
  exportPagedPreviewToPdfMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/modules/documents/ui/document-preview-pdf-export", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/documents/ui/document-preview-pdf-export")>();

  return {
    ...actual,
    exportPagedPreviewToPdf: exportPagedPreviewToPdfMock,
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

import { DocumentPreviewPage } from "@/modules/documents";
import {
  documentDetailResponse,
  emptyDocumentDetailResponse,
  failedDocumentDetailResponse,
  generatingDocumentDetailResponse,
} from "@/test/msw/fixtures";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";

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

const purezaLetterhead = {
  url: "/api/organizations/organization-1/letterhead/image",
};

const purezaLetterheadResolvedUrl =
  "http://localhost:3333/api/organizations/organization-1/letterhead/image";

function expectPrintOnlyLetterhead(url = purezaLetterheadResolvedUrl) {
  const sheet = screen.getByTestId("document-preview-sheet");

  expect(sheet).toHaveAttribute("data-document-letterhead", "true");
  expect(sheet.getAttribute("style") ?? "").toContain(url);
  expect(screen.getByTestId("document-preview-scroll-container")).toHaveAttribute(
    "data-document-letterhead",
    "true",
  );
  expect(sheet.querySelector("[data-document-letterhead-screen-layer]")).toBeNull();
  expect(sheet.querySelector("[data-document-letterhead-page-image]")).toBeNull();
  expect(sheet.querySelector("[data-document-letterhead-print-layer]")).toBeNull();
  expect(sheet).toHaveAttribute("data-paged-preview-letterhead", "true");
  expect(sheet.querySelector("[data-paged-preview-output]")).toBeInTheDocument();
}

beforeEach(() => {
  MockEventSource.instances = [];
  exportPagedPreviewToPdfMock.mockReset();
  exportPagedPreviewToPdfMock.mockResolvedValue(undefined);
  toastErrorMock.mockReset();
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
  expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
    "href",
    `/app/documento/${documentId}`,
  );
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
  const clonedRange = {
    selectNodeContents: vi.fn(),
    setEnd: vi.fn(),
    setStart: vi.fn(),
    toString: () => "",
  };

  return vi.spyOn(window, "getSelection").mockReturnValue({
    rangeCount: 1,
    toString: () => selectedText,
    getRangeAt: () =>
      ({
        cloneRange: () => clonedRange,
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
    expect(sheet).not.toHaveAttribute("data-document-letterhead");
    expect(sheet.querySelector("[data-document-letterhead-screen-layer]")).toBeNull();
    expect(sheet.querySelector("[data-document-letterhead-print-layer]")).toBeNull();
    expect(sheet.querySelector(".document-preview-prosemirror")).toBeInTheDocument();
    expect(document.querySelector("[data-institutional-document-markdown]")).toBeNull();
    expect(screen.getByTestId("document-preview-scroll-container")).toHaveAttribute(
      "data-institutional-document-preview-root",
    );
    expect(screen.getByTestId("document-preview-scroll-container")).toHaveAttribute(
      "data-document-preview-print-root",
    );
    expect(document.querySelector("[data-document-preview-workspace]")).toBeInTheDocument();
    expect(document.querySelector("[data-document-preview-content]")).toBeInTheDocument();
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
    expect(screen.getAllByText(/Processo:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contratacao de Servicos de TI/).length).toBeGreaterThan(0);
  });

  it("keeps organization letterhead print-only for completed markdown previews", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContentJson: null,
          letterhead: purezaLetterhead,
        }),
      ),
    );

    renderDocumentPreviewPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
      ).toBeInTheDocument();
    });

    expectPrintOnlyLetterhead();
    expect(document.querySelector("[data-institutional-document-markdown]")).toBeInTheDocument();
    expect(screen.getAllByText(/Contratacao de Servicos de TI/).length).toBeGreaterThan(0);
  });

  it("prints from print action and exports the official paged preview output from PDF action", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContentJson: null,
          letterhead: purezaLetterhead,
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/,
      }),
    ).toBeInTheDocument();

    const sheet = screen.getByTestId("document-preview-sheet");
    expect(sheet.querySelector("[data-paged-preview-output]")).toBeInTheDocument();
    expect(sheet.querySelector("[data-paged-preview-source]")).toBeInTheDocument();
    expect(sheet.querySelectorAll(".pagedjs_page")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));
    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(exportPagedPreviewToPdfMock).toHaveBeenCalledTimes(1);
    });
    expect(exportPagedPreviewToPdfMock).toHaveBeenCalledWith({
      fileName: documentDetailResponse.name,
      pages: expect.any(Array),
    });
    expect(exportPagedPreviewToPdfMock.mock.calls[0]?.[0].pages).toHaveLength(1);
    printSpy.mockRestore();
  });

  it("guards PDF export while a download is already running", async () => {
    let resolveExport: () => void = () => undefined;
    exportPagedPreviewToPdfMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveExport = resolve;
      }),
    );

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContentJson: null,
          letterhead: purezaLetterhead,
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

    const pendingButton = await screen.findByRole("button", { name: "Exportando..." });
    expect(pendingButton).toBeDisabled();

    fireEvent.click(pendingButton);

    expect(exportPagedPreviewToPdfMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveExport();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Exportar PDF" })).toBeEnabled();
    });
  });

  it("shows an error toast when PDF export fails", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
    exportPagedPreviewToPdfMock.mockRejectedValueOnce(
      new Error("O preview paginado ainda não está pronto para exportação."),
    );

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContentJson: null,
          letterhead: purezaLetterhead,
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exportar PDF" }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "O preview paginado ainda não está pronto para exportação.",
      );
    });
    expect(printSpy).not.toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it("prefers saved Tiptap JSON in completed preview and renders page breaks", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContent: "# Conteudo textual antigo\n\nEste texto nao deve aparecer.",
          draftContentJson: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "DOCUMENTO EDITADO EM JSON" }],
              },
              {
                type: "paragraph",
                attrs: { textAlign: "justify", indentLevel: 1 },
                content: [
                  {
                    type: "text",
                    marks: [{ type: "bold" }, { type: "underline" }],
                    text: "Trecho salvo pelo editor.",
                  },
                ],
              },
              { type: "horizontalRule" },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "2. Segunda pagina" }],
              },
            ],
          },
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "DOCUMENTO EDITADO EM JSON" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Este texto nao deve aparecer.")).not.toBeInTheDocument();

    const sheet = screen.getByTestId("document-preview-sheet");
    expect(sheet.querySelector(".document-preview-prosemirror hr")).toBeInTheDocument();
    const savedEditorText = screen.getAllByText("Trecho salvo pelo editor.")[0];
    expect(savedEditorText.closest("strong")).toBeInTheDocument();
    expect(savedEditorText.closest("u")).toBeInTheDocument();
    expect(savedEditorText.closest("p")).toHaveAttribute("data-indent-level", "1");
    expect(
      screen.getByRole("heading", { level: 2, name: "2. Segunda pagina" }),
    ).toBeInTheDocument();
  });

  it("renders automatic pagination frames for long Tiptap JSON preview content", async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const rect = (top: number, height: number) =>
          ({
            bottom: top + height,
            height,
            left: 0,
            right: 700,
            toJSON: () => ({}),
            top,
            width: 700,
            x: 0,
            y: top,
          }) as DOMRect;

        if (this.classList.contains("ProseMirror")) {
          return rect(0, 0);
        }

        if (this.parentElement?.classList.contains("ProseMirror")) {
          const siblings = Array.from(this.parentElement.children);
          const index = siblings.indexOf(this);
          const heights = [160, 700, 180];
          const top = heights.slice(0, index).reduce((sum, height) => sum + height, 0);

          return rect(top, heights[index] ?? 120);
        }

        return rect(0, 0);
      });

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          letterhead: purezaLetterhead,
          draftContentJson: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "DOCUMENTO LONGO EM JSON" }],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Conteudo suficiente para ocupar a primeira pagina." },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "2. Conteudo seguinte" }],
              },
            ],
          },
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "DOCUMENTO LONGO EM JSON" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      const sheet = screen.getByTestId("document-preview-sheet");
      const movedHeading = screen.getByRole("heading", { level: 2, name: "2. Conteudo seguinte" });

      expectPrintOnlyLetterhead();
      expect(sheet.querySelector("[data-paged-preview-output]")).toBeInTheDocument();
      expect(sheet.querySelectorAll(".pagedjs_page")).toHaveLength(1);
      expect(sheet.querySelectorAll("[data-document-letterhead-page-image]")).toHaveLength(0);
      expect(movedHeading.closest(".pagedjs_page")).toBeInTheDocument();
    });

    rectSpy.mockRestore();
  });

  it("does not render extra pagination frames from scroll height without a flow boundary", async () => {
    const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollHeight",
    );
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const rect = (top: number, height: number) =>
          ({
            bottom: top + height,
            height,
            left: 0,
            right: 700,
            toJSON: () => ({}),
            top,
            width: 700,
            x: 0,
            y: top,
          }) as DOMRect;

        if (this.classList.contains("ProseMirror")) {
          return rect(0, 0);
        }

        if (this.parentElement?.classList.contains("ProseMirror")) {
          const siblings = Array.from(this.parentElement.children);
          const index = siblings.indexOf(this);
          const heights = [120, 180, 200];
          const top = heights.slice(0, index).reduce((sum, height) => sum + height, 0);

          return rect(top, heights[index] ?? 120);
        }

        return rect(0, 0);
      });

    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return this.classList.contains("ProseMirror") ? 3200 : 0;
      },
    });

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContentJson: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "DOCUMENTO CURTO EM JSON" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Conteudo curto." }],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "2. Ainda na primeira pagina" }],
              },
            ],
          },
        }),
      ),
    );

    renderDocumentPreviewPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "DOCUMENTO CURTO EM JSON" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      const sheet = screen.getByTestId("document-preview-sheet");

      expect(sheet.querySelectorAll(".pagedjs_page")).toHaveLength(1);
      expect(
        sheet.querySelector("[data-document-pagination-break-before]"),
      ).not.toBeInTheDocument();
    });

    rectSpy.mockRestore();

    if (scrollHeightDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "scrollHeight", scrollHeightDescriptor);
    } else {
      delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
    }
  });

  it("keeps completed document preview read-only when document text is selected", async () => {
    const selectedText = "Contratacao de Servicos de TI para suporte tecnico especializado.";
    const suggestionRequest = vi.fn();
    const applyRequest = vi.fn();

    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json(documentDetailResponse),
      ),
      http.post("http://localhost:3333/api/documents/:documentId/adjustments/suggestions", () => {
        suggestionRequest();
        return HttpResponse.json({ message: "Preview must not request suggestions." });
      }),
      http.post("http://localhost:3333/api/documents/:documentId/adjustments/apply", () => {
        applyRequest();
        return HttpResponse.json({ message: "Preview must not apply adjustments." });
      }),
    );

    renderDocumentPreviewPage();

    const sheet = await screen.findByTestId("document-preview-sheet");
    const documentBody = sheet.querySelector("[data-document-body]");
    expect(documentBody).not.toBeNull();
    mockDocumentTextSelection(selectedText, documentBody as HTMLElement);

    fireEvent.mouseUp(sheet);
    fireEvent.keyUp(sheet);

    expect(screen.queryByText("Ajustar texto")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gerar ajuste" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aplicar" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-document-adjustment-skeleton]")).toBeNull();
    expect(suggestionRequest).not.toHaveBeenCalled();
    expect(applyRequest).not.toHaveBeenCalled();
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
  });

  it("renders institutional administrative fields and list emphasis", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContentJson: null,
          draftContent: `# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)

## 1. DADOS DA SOLICITACAO

- Unidade Orcamentaria: 06.001 - Secretaria Municipal de Educacao
- Numero da Solicitacao: 6
- Data de Emissao: 08/01/2026
- Processo: Servico
- Objeto: Contratacao de apresentacao artistica
- **Critério principal:** atendimento ao interesse publico.
`,
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
    const budgetUnitLabel = screen.getAllByText("Unidade Orcamentaria:")[0];
    expect(budgetUnitLabel.closest("li")).toHaveAttribute(
      "data-institutional-administrative-field",
    );
    expect(budgetUnitLabel).toHaveClass("institutional-document-field-label");
    expect(screen.getAllByText("06.001 - Secretaria Municipal de Educacao")[0]).not.toHaveClass(
      "font-semibold",
    );
    expect(screen.getAllByText("Critério principal:")[0]).toHaveClass("font-semibold");
    expect(screen.queryByRole("heading", { name: /FECHO|ASSINATURA/i })).not.toBeInTheDocument();
  });

  it("renders the generated signature closing block without a visible heading", async () => {
    server.use(
      http.get("http://localhost:3333/api/documents/:documentId", () =>
        HttpResponse.json({
          ...documentDetailResponse,
          draftContent: `# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)

Conteudo do documento.

<div align="right">Pureza/RN, 08 de janeiro de 2026.</div>

<div align="center">Maria Costa</div>

<div align="center">Secretaria Municipal</div>`,
          draftContentJson: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Conteudo do documento." }],
              },
              {
                type: "paragraph",
                attrs: {
                  noFirstLineIndent: true,
                  signatureClosingPart: "date",
                  textAlign: "right",
                },
                content: [{ type: "text", text: "Pureza/RN, 08 de janeiro de 2026." }],
              },
              {
                type: "paragraph",
                attrs: {
                  noFirstLineIndent: true,
                  signatureClosingPart: "name",
                  textAlign: "center",
                },
                content: [{ type: "text", text: "Maria Costa" }],
              },
              {
                type: "paragraph",
                attrs: {
                  noFirstLineIndent: true,
                  signatureClosingPart: "role",
                  textAlign: "center",
                },
                content: [{ type: "text", text: "Secretaria Municipal" }],
              },
            ],
          },
        }),
      ),
    );

    renderDocumentPreviewPage();

    await waitFor(() => {
      expect(screen.getAllByText("Pureza/RN, 08 de janeiro de 2026.").length).toBeGreaterThan(0);
    });

    expect(screen.queryByRole("heading", { name: /FECHO|ASSINATURA/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/<div/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/align=/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/_{8,}/)).not.toBeInTheDocument();
    const dateParagraph = screen.getAllByText("Pureza/RN, 08 de janeiro de 2026.")[0].closest("p");

    expect(dateParagraph).toHaveStyle({
      textAlign: "right",
    });
    expect(dateParagraph).toHaveAttribute("data-signature-closing-part", "date");
    for (const text of ["Maria Costa", "Secretaria Municipal"]) {
      const paragraph = screen.getByText(text).closest("p");

      expect(paragraph).toHaveStyle({ textAlign: "center" });
      expect(paragraph).toHaveAttribute("data-no-first-line-indent", "true");
    }
    expect(screen.getByText("Maria Costa").closest("p")).toHaveAttribute(
      "data-signature-closing-part",
      "name",
    );
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
          draftContentJson: null,
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
    expect(screen.getByRole("status", { name: "Gerando preview" })).toBeInTheDocument();
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
    expect(screen.getByRole("status", { name: "Gerando documento" })).toBeInTheDocument();
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
          draftContentJson: null,
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
          draftContentJson: null,
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
          HttpResponse.json({
            ...documentDetailResponse,
            draftContentJson: null,
          }),
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
      expect(screen.getAllByText(/Suporte a infraestrutura de rede/).length).toBeGreaterThan(0);

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
            draftContentJson: null,
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
      expect(screen.getAllByText(/Conteudo normal/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Texto apos HTML/).length).toBeGreaterThan(0);
    });

    it("renders unsafe link scheme without navigating through it", async () => {
      server.use(
        http.get("http://localhost:3333/api/documents/:documentId", () =>
          HttpResponse.json({
            ...documentDetailResponse,
            draftContentJson: null,
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
      expect(screen.getAllByText(/Texto normal/).length).toBeGreaterThan(0);
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
