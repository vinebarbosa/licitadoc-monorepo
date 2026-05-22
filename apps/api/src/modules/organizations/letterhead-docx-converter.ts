import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";
import { createCanvas } from "@napi-rs/canvas";
import { BadRequestError } from "../../shared/errors/bad-request-error";

const execFileAsync = promisify(execFile);
const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const GOTENBERG_LIBREOFFICE_CONVERT_PATH = "/forms/libreoffice/convert";
const LETTERHEAD_JPEG_CONTENT_TYPE = "image/jpeg";
const LETTERHEAD_PDF_CONTENT_TYPE = "application/pdf";
const PDF_RENDER_SCALE = 2;
const DEFAULT_CONVERSION_TIMEOUT_MS = 30_000;

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
  fetch?: typeof fetch;
  gotenbergUrl?: null | string;
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

function getDefaultConversionTimeoutMs() {
  const timeoutMs = Number(process.env.LETTERHEAD_DOCX_CONVERSION_TIMEOUT_MS);

  return Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_CONVERSION_TIMEOUT_MS;
}

function getConfiguredGotenbergUrl(gotenbergUrl: null | string | undefined) {
  if (gotenbergUrl === null) {
    return null;
  }

  const value = gotenbergUrl ?? process.env.LETTERHEAD_GOTENBERG_URL;
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

function getGotenbergLibreOfficeConvertUrl(gotenbergUrl: string) {
  const url = new URL(gotenbergUrl);

  if (!url.pathname.endsWith(GOTENBERG_LIBREOFFICE_CONVERT_PATH)) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}${GOTENBERG_LIBREOFFICE_CONVERT_PATH}`;
  }

  return url;
}

async function readGotenbergError(response: Response) {
  const text = await response.text().catch(() => "");

  return text.trim().slice(0, 240);
}

export async function convertLetterheadDocxToPdfWithGotenberg({
  buffer,
  fetch: fetchImplementation = fetch,
  fileName,
  gotenbergUrl,
  timeoutMs = getDefaultConversionTimeoutMs(),
}: {
  buffer: Buffer;
  fetch?: typeof fetch;
  fileName: string;
  gotenbergUrl: string;
  timeoutMs?: number;
}) {
  const formData = new FormData();
  const docxBlob = new Blob([new Uint8Array(buffer)], { type: DOCX_CONTENT_TYPE });
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  formData.append("files", docxBlob, fileName);

  try {
    const response = await fetchImplementation(getGotenbergLibreOfficeConvertUrl(gotenbergUrl), {
      body: formData,
      headers: {
        "Gotenberg-Output-Filename": getLetterheadJpegFileName(fileName).replace(/\.jpg$/, ""),
      },
      method: "POST",
      signal: abortController.signal,
    });

    if (!response.ok) {
      const details = await readGotenbergError(response);
      throw new BadRequestError(
        details
          ? `Não foi possível converter o DOCX do papel timbrado no Gotenberg: ${details}`
          : "Não foi possível converter o DOCX do papel timbrado no Gotenberg.",
      );
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    if (pdfBuffer.byteLength === 0) {
      throw new BadRequestError("A conversão do papel timbrado gerou um PDF vazio.");
    }

    return {
      buffer: pdfBuffer,
      contentType: response.headers.get("content-type") ?? LETTERHEAD_PDF_CONTENT_TYPE,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    const isTimeout =
      typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";

    throw new BadRequestError(
      isTimeout
        ? "O conversor Gotenberg demorou demais para processar o DOCX do papel timbrado."
        : "Não foi possível acionar o conversor Gotenberg do papel timbrado.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function convertLetterheadDocxToPdfWithLibreOffice({
  buffer,
  fileName,
  libreOfficeBinary = process.env.LETTERHEAD_LIBREOFFICE_BIN || "soffice",
  timeoutMs = getDefaultConversionTimeoutMs(),
}: {
  buffer: Buffer;
  fileName: string;
  libreOfficeBinary?: string;
  timeoutMs?: number;
}) {
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

    return {
      buffer: await readFile(pdfPath),
      contentType: LETTERHEAD_PDF_CONTENT_TYPE,
    };
  } finally {
    await rm(workDir, { force: true, recursive: true });
  }
}

export const convertLetterheadDocxToJpeg: LetterheadDocxConverter = async ({
  buffer,
  fetch: fetchImplementation,
  fileName,
  gotenbergUrl,
  libreOfficeBinary,
  timeoutMs = getDefaultConversionTimeoutMs(),
}) => {
  const configuredGotenbergUrl = getConfiguredGotenbergUrl(gotenbergUrl);
  const pdf = configuredGotenbergUrl
    ? await convertLetterheadDocxToPdfWithGotenberg({
        buffer,
        fetch: fetchImplementation,
        fileName,
        gotenbergUrl: configuredGotenbergUrl,
        timeoutMs,
      })
    : await convertLetterheadDocxToPdfWithLibreOffice({
        buffer,
        fileName,
        libreOfficeBinary,
        timeoutMs,
      });
  const jpegBuffer = await renderFirstPdfPageAsJpeg(pdf.buffer);

  if (jpegBuffer.byteLength === 0) {
    throw new BadRequestError("A conversão do papel timbrado gerou uma imagem vazia.");
  }

  return {
    buffer: jpegBuffer,
    contentType: LETTERHEAD_JPEG_CONTENT_TYPE,
    fileName: getLetterheadJpegFileName(fileName),
  };
};
