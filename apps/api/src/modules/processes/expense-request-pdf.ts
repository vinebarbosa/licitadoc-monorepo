import type { FastifyInstance } from "fastify";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import type { FileStorageProvider } from "../../shared/storage/types";
import { createProcessFromExpenseRequestText } from "./expense-request-intake";

type PdfTextItem = {
  hasEOL?: boolean;
  str?: string;
};

type PdfPage = {
  getTextContent(): Promise<{
    items: PdfTextItem[];
  }>;
};

type PdfDocument = {
  getPage(pageNumber: number): Promise<PdfPage>;
  numPages: number;
};

type PdfLoadingTask = {
  destroy?: () => Promise<void> | void;
  promise: Promise<PdfDocument>;
};

type PdfLoader = (input: { data: Uint8Array; disableWorker: boolean }) => PdfLoadingTask;

type MultipartFileValue = {
  fieldname: string;
  filename: string;
  mimetype: string;
  toBuffer(): Promise<Buffer>;
  type: "file";
};

type MultipartFieldValue = {
  type: "field";
  value: unknown;
};

type MultipartRequestBody = Record<string, MultipartFieldValue | MultipartFileValue | unknown>;

export type NormalizedExpenseRequestPdfUpload = {
  buffer: Buffer;
  contentType: string;
  departmentIds?: string[];
  fileName: string;
  organizationId?: string;
  sourceLabel?: string | null;
};

type CreateProcessFromExpenseRequestPdfInput = {
  actor: Actor;
  db: FastifyInstance["db"];
  input: NormalizedExpenseRequestPdfUpload;
  storage: FileStorageProvider;
};

function cleanExtractedText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatPdfPageText(items: PdfTextItem[]) {
  return items
    .map((item) => {
      const text = typeof item.str === "string" ? item.str : "";
      return item.hasEOL ? `${text}\n` : `${text} `;
    })
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isMultipartFileValue(value: unknown): value is MultipartFileValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "file" &&
    "toBuffer" in value &&
    typeof value.toBuffer === "function" &&
    "filename" in value &&
    typeof value.filename === "string" &&
    "mimetype" in value &&
    typeof value.mimetype === "string"
  );
}

function isMultipartFieldValue(value: unknown): value is MultipartFieldValue {
  return typeof value === "object" && value !== null && "type" in value && value.type === "field";
}

function normalizeNullableText(value: unknown) {
  const nextValue = isMultipartFieldValue(value) ? value.value : value;

  if (nextValue == null) {
    return null;
  }

  if (typeof nextValue !== "string") {
    throw new BadRequestError("Multipart field value must be a string.");
  }

  const trimmed = nextValue.trim();

  return trimmed ? trimmed : null;
}

function normalizeDepartmentIds(value: unknown) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  const normalized = values
    .map((entry) => normalizeNullableText(entry))
    .filter((entry): entry is string => Boolean(entry));

  return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined;
}

function countMultipartFiles(body: MultipartRequestBody) {
  return Object.values(body)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(isMultipartFileValue).length;
}

function isPdfUpload(fileName: string, contentType: string) {
  return contentType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

function toBadRequestMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "PasswordException"
  ) {
    return "Password-protected PDFs are not supported.";
  }

  return "Expense request PDF could not be read.";
}

export async function extractTextFromPdf(
  buffer: Buffer,
  loadPdfDocument: PdfLoader = getDocument as PdfLoader,
) {
  let loadingTask: PdfLoadingTask | null = null;

  try {
    loadingTask = loadPdfDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = formatPdfPageText(textContent.items);

      pages.push(pageText);
    }

    const text = pages.join("\n").trim();

    if (!cleanExtractedText(text)) {
      throw new BadRequestError("Expense request PDF does not contain machine-readable text.");
    }

    return text;
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    throw new BadRequestError(toBadRequestMessage(error));
  } finally {
    await loadingTask?.destroy?.();
  }
}

export async function normalizeExpenseRequestPdfUpload({
  body,
  maxBytes,
}: {
  body: MultipartRequestBody | undefined;
  maxBytes: number;
}) {
  if (!body) {
    throw new BadRequestError("Expense request PDF upload is required.");
  }

  const fileCount = countMultipartFiles(body);

  if (fileCount !== 1 || !isMultipartFileValue(body.file)) {
    throw new BadRequestError("Exactly one PDF file must be provided in the `file` field.");
  }

  const file = body.file;

  if (!isPdfUpload(file.filename, file.mimetype)) {
    throw new BadRequestError("Expense request upload must be a PDF file.");
  }

  let buffer: Buffer;

  try {
    buffer = await file.toBuffer();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "FastifyError"
    ) {
      throw new BadRequestError("Expense request PDF must be 3 MB or smaller.");
    }

    throw error;
  }

  if (buffer.byteLength === 0) {
    throw new BadRequestError("Expense request PDF cannot be empty.");
  }

  if (buffer.byteLength > maxBytes) {
    throw new BadRequestError("Expense request PDF must be 3 MB or smaller.");
  }

  return {
    buffer,
    contentType: "application/pdf",
    departmentIds: normalizeDepartmentIds(body.departmentIds),
    fileName: file.filename,
    organizationId: normalizeNullableText(body.organizationId) ?? undefined,
    sourceLabel: normalizeNullableText(body.sourceLabel),
  } satisfies NormalizedExpenseRequestPdfUpload;
}

export async function createProcessFromExpenseRequestPdf({
  actor,
  db,
  input,
  storage,
}: CreateProcessFromExpenseRequestPdfInput) {
  const storedFile = await storage.storeExpenseRequestPdf({
    buffer: input.buffer,
    contentType: input.contentType,
    fileName: input.fileName,
  });

  try {
    const expenseRequestText = await extractTextFromPdf(input.buffer);

    return await createProcessFromExpenseRequestText({
      actor,
      db,
      input: {
        expenseRequestText,
        fileName: input.fileName,
        organizationId: input.organizationId,
        departmentIds: input.departmentIds,
        sourceLabel: input.sourceLabel,
        sourceFile: storedFile,
      },
    });
  } catch (error) {
    await storage.deleteObject({
      bucket: storedFile.bucket,
      key: storedFile.key,
    });

    throw error;
  }
}
