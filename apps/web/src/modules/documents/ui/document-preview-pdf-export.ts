import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const a4PageWidthMm = 210;
const a4PageHeightMm = 297;
const pageMarginMm = 16;

export class DocumentPreviewPdfExportError extends Error {
  constructor(message = "Não foi possível exportar o PDF.") {
    super(message);
    this.name = "DocumentPreviewPdfExportError";
  }
}

function sanitizePdfFileName(fileName: string) {
  const sanitized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return sanitized || "documento";
}

function downloadPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getPagedPreviewPageElements(root: ParentNode | null | undefined) {
  return Array.from(
    root?.querySelectorAll<HTMLElement>("[data-paged-preview-output] .pagedjs_page") ?? [],
  );
}

function addTextFallbackPage(pdf: jsPDF, page: HTMLElement) {
  const text = page.innerText.replace(/\n{3,}/g, "\n\n").trim() || "Página sem texto renderizável.";
  const lines = pdf.splitTextToSize(text, a4PageWidthMm - pageMarginMm * 2);

  pdf.setFontSize(11);
  pdf.text(lines, pageMarginMm, pageMarginMm, {
    maxWidth: a4PageWidthMm - pageMarginMm * 2,
  });
}

async function addPreviewPageToPdf(pdf: jsPDF, page: HTMLElement) {
  try {
    const canvas = await html2canvas(page, {
      backgroundColor: "#ffffff",
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      allowTaint: false,
    });

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      a4PageWidthMm,
      a4PageHeightMm,
      undefined,
      "FAST",
    );
  } catch {
    addTextFallbackPage(pdf, page);
  }
}

export async function exportPagedPreviewToPdf({
  fileName,
  pages,
}: {
  fileName: string;
  pages: HTMLElement[];
}) {
  if (pages.length === 0) {
    throw new DocumentPreviewPdfExportError(
      "O preview paginado ainda não está pronto para exportação.",
    );
  }

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });

  for (const [index, page] of pages.entries()) {
    if (index > 0) {
      pdf.addPage("a4", "portrait");
    }

    await addPreviewPageToPdf(pdf, page);
  }

  downloadPdfBlob(pdf.output("blob"), `${sanitizePdfFileName(fileName)}.pdf`);
}
