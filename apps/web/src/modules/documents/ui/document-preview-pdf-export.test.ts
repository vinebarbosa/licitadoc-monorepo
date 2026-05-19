import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  addImageMock,
  addPageMock,
  html2canvasMock,
  jsPdfMock,
  outputMock,
  setFontSizeMock,
  splitTextToSizeMock,
  textMock,
} = vi.hoisted(() => ({
  addImageMock: vi.fn(),
  addPageMock: vi.fn(),
  html2canvasMock: vi.fn(),
  jsPdfMock: vi.fn(),
  outputMock: vi.fn(),
  setFontSizeMock: vi.fn(),
  splitTextToSizeMock: vi.fn(),
  textMock: vi.fn(),
}));

vi.mock("html2canvas", () => ({
  default: html2canvasMock,
}));

vi.mock("jspdf", () => ({
  jsPDF: jsPdfMock,
}));

import {
  DocumentPreviewPdfExportError,
  exportPagedPreviewToPdf,
  getPagedPreviewPageElements,
} from "./document-preview-pdf-export";

describe("document preview PDF export", () => {
  beforeEach(() => {
    addImageMock.mockReset();
    addPageMock.mockReset();
    html2canvasMock.mockReset();
    jsPdfMock.mockReset();
    outputMock.mockReset();
    setFontSizeMock.mockReset();
    splitTextToSizeMock.mockReset();
    textMock.mockReset();
    outputMock.mockReturnValue(new Blob(["%PDF-1.3"], { type: "application/pdf" }));
    splitTextToSizeMock.mockImplementation((text: string) => [text]);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:documento");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    jsPdfMock.mockReturnValue({
      addImage: addImageMock,
      addPage: addPageMock,
      output: outputMock,
      setFontSize: setFontSizeMock,
      splitTextToSize: splitTextToSizeMock,
      text: textMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports rendered pages in order using A4 PDF sizing", async () => {
    const firstPage = document.createElement("div");
    const secondPage = document.createElement("div");
    html2canvasMock
      .mockResolvedValueOnce({
        toDataURL: () => "data:image/png;base64,first",
      })
      .mockResolvedValueOnce({
        toDataURL: () => "data:image/png;base64,second",
      });

    await exportPagedPreviewToPdf({
      fileName: "Documento Teste",
      pages: [firstPage, secondPage],
    });

    expect(jsPdfMock).toHaveBeenCalledWith({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    expect(html2canvasMock.mock.calls.map(([page]) => page)).toEqual([firstPage, secondPage]);
    expect(addPageMock).toHaveBeenCalledWith("a4", "portrait");
    expect(addImageMock).toHaveBeenNthCalledWith(
      1,
      "data:image/png;base64,first",
      "PNG",
      0,
      0,
      210,
      297,
      undefined,
      "FAST",
    );
    expect(addImageMock).toHaveBeenNthCalledWith(
      2,
      "data:image/png;base64,second",
      "PNG",
      0,
      0,
      210,
      297,
      undefined,
      "FAST",
    );
    expect(outputMock).toHaveBeenCalledWith("blob");
    expect(document.querySelector('a[download="documento-teste.pdf"]')).toBeNull();
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it("falls back to text content when a rendered page cannot be rasterized", async () => {
    const page = document.createElement("div");
    page.innerText = "Conteudo textual da pagina";
    html2canvasMock.mockRejectedValueOnce(new Error("Canvas failed"));

    await exportPagedPreviewToPdf({
      fileName: "Documento",
      pages: [page],
    });

    expect(addImageMock).not.toHaveBeenCalled();
    expect(splitTextToSizeMock).toHaveBeenCalledWith("Conteudo textual da pagina", 178);
    expect(setFontSizeMock).toHaveBeenCalledWith(11);
    expect(textMock).toHaveBeenCalledWith(["Conteudo textual da pagina"], 16, 16, {
      maxWidth: 178,
    });
    expect(outputMock).toHaveBeenCalledWith("blob");
  });

  it("fails with a controlled error when no rendered pages are available", async () => {
    await expect(exportPagedPreviewToPdf({ fileName: "Documento", pages: [] })).rejects.toThrow(
      DocumentPreviewPdfExportError,
    );
  });

  it("finds rendered Paged.js pages inside the preview output", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <section data-paged-preview-output>
        <div class="pagedjs_page"></div>
        <div class="pagedjs_page"></div>
      </section>
      <div class="pagedjs_page"></div>
    `;

    expect(getPagedPreviewPageElements(root)).toHaveLength(2);
  });
});
