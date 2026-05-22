import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";
import { createCanvas } from "@napi-rs/canvas";
import { BadRequestError } from "../../shared/errors/bad-request-error";

const execFileAsync = promisify(execFile);
const LETTERHEAD_JPEG_CONTENT_TYPE = "image/jpeg";
const PDF_RENDER_SCALE = 2;

type PdfPage = {
  getViewport(input: { scale: number }): { height: number; width: number };
  render(input: { canvasContext: unknown; viewport: { height: number; width: number } }): {
    promise: Promise<void>;
  };
};

type PdfDocument = {
  getPage(pageNumber: number): Promise<PdfPage>;
};

type PdfLoadingTask = {
  destroy?: () => Promise<void> | void;
  promise: Promise<PdfDocument>;
};

type PdfLoader = (input: { data: Uint8Array; disableWorker: boolean }) => PdfLoadingTask;

export type ConvertedLetterheadDocx = {
  buffer: Buffer;
  contentType: typeof LETTERHEAD_JPEG_CONTENT_TYPE;
  fileName: string;
};

export type LetterheadDocxConverter = (input: {
  buffer: Buffer;
  fileName: string;
  libreOfficeBinary?: string;
  timeoutMs?: number;
}) => Promise<ConvertedLetterheadDocx>;

function getLetterheadJpegFileName(fileName: string) {
  const extension = extname(fileName);
  const baseName = basename(fileName, extension).trim() || "papel-timbrado";

  return `${baseName}.jpg`;
}

async function getDefaultPdfLoader(): Promise<PdfLoader> {
  await import("@napi-rs/canvas");

  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  return getDocument as PdfLoader;
}

async function renderFirstPdfPageAsJpeg(buffer: Buffer) {
  const getDocument = await getDefaultPdfLoader();
  const loadingTask = getDocument({ data: new Uint8Array(buffer), disableWorker: true });

  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;

    return canvas.toBuffer("image/jpeg");
  } finally {
    await loadingTask.destroy?.();
  }
}

async function findConvertedPdf(directory: string) {
  const entries = await readdir(directory);
  const pdfs = entries.filter((entry) => entry.toLowerCase().endsWith(".pdf"));

  return pdfs[0] ? join(directory, pdfs[0]) : null;
}

export const convertLetterheadDocxToJpeg: LetterheadDocxConverter = async ({
  buffer,
  fileName,
  libreOfficeBinary = process.env.LETTERHEAD_LIBREOFFICE_BIN || "soffice",
  timeoutMs = Number(process.env.LETTERHEAD_DOCX_CONVERSION_TIMEOUT_MS || 30_000),
}) => {
  const workDir = await mkdtemp(join(tmpdir(), "licitadoc-letterhead-"));
  const sourcePath = join(
    workDir,
    fileName.toLowerCase().endsWith(".docx") ? fileName : "source.docx",
  );

  try {
    await writeFile(sourcePath, buffer);

    try {
      await execFileAsync(
        libreOfficeBinary,
        ["--headless", "--convert-to", "pdf", "--outdir", workDir, sourcePath],
        { timeout: timeoutMs },
      );
    } catch (error) {
      const isMissingBinary =
        typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

      if (isMissingBinary) {
        throw new BadRequestError("O conversor de DOCX para timbre não está configurado.");
      }

      throw new BadRequestError("Não foi possível converter o DOCX do papel timbrado.");
    }

    const pdfPath = await findConvertedPdf(workDir);

    if (!pdfPath) {
      throw new BadRequestError("Não foi possível converter o DOCX do papel timbrado.");
    }

    const pdfBuffer = await readFile(pdfPath);
    const jpegBuffer = await renderFirstPdfPageAsJpeg(pdfBuffer);

    if (jpegBuffer.byteLength === 0) {
      throw new BadRequestError("A conversão do papel timbrado gerou uma imagem vazia.");
    }

    return {
      buffer: jpegBuffer,
      contentType: LETTERHEAD_JPEG_CONTENT_TYPE,
      fileName: getLetterheadJpegFileName(fileName),
    };
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
};
