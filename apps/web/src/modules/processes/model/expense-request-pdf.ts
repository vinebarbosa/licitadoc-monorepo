import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import type {
  ExpenseRequestExtractionItem,
  ExpenseRequestExtractionResult,
  ExpenseRequestExtractionWarning,
  ProcessCreationFormValues,
} from "./processes";
import {
  deriveProcessTitlePreview,
  normalizeDateInput,
  toExpenseRequestFormItems,
} from "./processes";

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

export type PdfLoader = (input: { data: Uint8Array; disableWorker: boolean }) => PdfLoadingTask;

type PdfJsModule = {
  getDocument: PdfLoader;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
};

export class ExpenseRequestPdfError extends Error {
  readonly reason:
    | "invalid_file"
    | "read_failed"
    | "empty_text"
    | "unrecognized_sd"
    | "missing_required_fields";

  constructor(
    message: string,
    reason:
      | "invalid_file"
      | "read_failed"
      | "empty_text"
      | "unrecognized_sd"
      | "missing_required_fields" = "read_failed",
  ) {
    super(message);
    this.name = "ExpenseRequestPdfError";
    this.reason = reason;
  }
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(value: string) {
  return stripDiacritics(value).toLowerCase();
}

function getLines(text: string) {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean);
}

function findLineIndex(lines: string[], matcher: (line: string) => boolean) {
  return lines.findIndex((line) => matcher(normalizeKey(line)));
}

function valueAfterLabel(lines: string[], matcher: (line: string) => boolean) {
  const index = findLineIndex(lines, matcher);

  if (index < 0) {
    return null;
  }

  const line = lines[index] ?? "";
  const [, sameLineValue = ""] = line.split(/:(.*)/s);

  if (cleanText(sameLineValue)) {
    return cleanText(sameLineValue);
  }

  return lines[index + 1] ?? null;
}

function sectionAfterLabel(
  lines: string[],
  startMatcher: (line: string) => boolean,
  endMatchers: Array<(line: string) => boolean>,
) {
  const start = findLineIndex(lines, startMatcher);

  if (start < 0) {
    return null;
  }

  const firstLine = lines[start] ?? "";
  const [, sameLineValue = ""] = firstLine.split(/:(.*)/s);
  const values = cleanText(sameLineValue) ? [cleanText(sameLineValue)] : [];

  for (const line of lines.slice(start + 1)) {
    const normalized = normalizeKey(line);

    if (endMatchers.some((matcher) => matcher(normalized))) {
      break;
    }

    values.push(line);
  }

  return cleanText(values.join(" ")) || null;
}

function parseBudgetUnit(value: string | null) {
  if (!value) {
    return {
      budgetUnitCode: null,
      budgetUnitName: null,
    };
  }

  const match = value.match(/^(\d{2}\.\d{3})\s*[-–]\s*(.+)$/);

  return {
    budgetUnitCode: match?.[1] ?? null,
    budgetUnitName: cleanText(match?.[2] ?? value),
  };
}

function parseDate(value: string | null) {
  const match = value?.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  return `${year}-${month}-${day}`;
}

function parseResponsible(lines: string[]) {
  const cpfIndex = lines.findIndex((line) => /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/.test(line));

  if (cpfIndex <= 0) {
    return {
      responsibleName: null,
      responsibleRole: null,
    };
  }

  return {
    responsibleName: lines[cpfIndex - 1] ?? null,
    responsibleRole: lines[cpfIndex - 2] ?? null,
  };
}

function parseItem(lines: string[]): ExpenseRequestExtractionItem {
  const start = findLineIndex(lines, (line) => line.startsWith("item descricao"));
  const end = findLineIndex(lines, (line) => line.includes("valor total"));

  if (start < 0 || end <= start) {
    return {
      code: null,
      description: null,
      quantity: null,
      unit: null,
      unitValue: null,
      totalValue: null,
    };
  }

  const itemText = cleanText(lines.slice(start + 1, end).join(" "));
  const valuesMatch = itemText.match(
    /\b(?:(\d{4,})\s+)?(\d+(?:[,.]\d+)?)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s*([\p{Lu}.]+)\b/u,
  );
  const beforeValues = itemText.slice(0, valuesMatch?.index ?? itemText.length);
  const codeMatches = Array.from(beforeValues.matchAll(/\b(\d{4,})\b/g));
  const codeMatch = codeMatches.at(-1);
  const code = valuesMatch?.[1] ?? codeMatch?.[1] ?? null;
  const descriptionEnd = codeMatch?.index ?? beforeValues.length;

  return {
    code,
    description: cleanText(itemText.slice(0, descriptionEnd)) || null,
    quantity: valuesMatch?.[2] ?? null,
    unitValue: valuesMatch?.[3] ?? null,
    totalValue: valuesMatch?.[4] ?? null,
    unit: valuesMatch?.[5] ?? null,
  };
}

function isIgnorableItemSectionLine(line: string) {
  const normalized = normalizeKey(line);

  return (
    normalized.includes("sistema orcamentario") ||
    normalized.includes("financeiro e contabil") ||
    normalized.startsWith("pag.:") ||
    normalized.includes(" pag.:") ||
    normalized.startsWith("item descricao")
  );
}

function parseItemValueLine(line: string) {
  return line.match(
    /^(?:(.*?)\s+)?(\d{4,})\s+(\d+(?:[,.]\d+)?)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\p{L}.]+)\s*$/u,
  );
}

function parseItems(lines: string[]): ExpenseRequestExtractionItem[] {
  const start = findLineIndex(lines, (line) => line.startsWith("item descricao"));
  const end = findLineIndex(
    lines,
    (line) => line.includes("valor total") && !line.startsWith("item descricao"),
  );

  if (start < 0 || end <= start) {
    return [];
  }

  const items: ExpenseRequestExtractionItem[] = [];
  let descriptionLines: string[] = [];

  for (const line of lines.slice(start + 1, end)) {
    if (isIgnorableItemSectionLine(line)) {
      continue;
    }

    const valueMatch = parseItemValueLine(line);

    if (!valueMatch) {
      descriptionLines.push(line);
      continue;
    }

    const [, inlineDescription = "", code, quantity, unitValue, totalValue, unit] = valueMatch;
    const description = cleanText([...descriptionLines, inlineDescription].join(" "));

    items.push({
      code,
      description: description || null,
      quantity,
      unit,
      unitValue,
      totalValue,
    });
    descriptionLines = [];
  }

  return items;
}

export function configurePdfWorker(pdfjs: Pick<PdfJsModule, "GlobalWorkerOptions">) {
  if (pdfjs.GlobalWorkerOptions.workerSrc !== pdfWorkerUrl) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
}

async function defaultPdfLoader(input: { data: Uint8Array; disableWorker: boolean }) {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfJsModule;

  configurePdfWorker(pdfjs);

  return pdfjs.getDocument(input);
}

function toPdfError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "PasswordException"
  ) {
    return new ExpenseRequestPdfError("PDF protegido por senha não é suportado.", "read_failed");
  }

  if (error instanceof ExpenseRequestPdfError) {
    return error;
  }

  return new ExpenseRequestPdfError("Não foi possível ler o PDF selecionado.", "read_failed");
}

export async function extractTextFromExpenseRequestPdf(
  file: File,
  loadPdf: (input: {
    data: Uint8Array;
    disableWorker: boolean;
  }) => PdfLoadingTask | Promise<PdfLoadingTask> = defaultPdfLoader,
) {
  if (file.size === 0) {
    throw new ExpenseRequestPdfError("O PDF selecionado esta vazio.", "invalid_file");
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new ExpenseRequestPdfError("Selecione um arquivo PDF.", "invalid_file");
  }

  let loadingTask: PdfLoadingTask | null = null;

  try {
    const buffer = await file.arrayBuffer();
    loadingTask = await loadPdf({
      data: new Uint8Array(buffer),
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          const text = typeof item.str === "string" ? item.str : "";
          return item.hasEOL ? `${text}\n` : text;
        })
        .join(" ");

      pages.push(pageText);
    }

    const text = pages.join("\n").trim();

    if (!cleanText(text)) {
      throw new ExpenseRequestPdfError("O PDF não contém texto selecionável.", "empty_text");
    }

    return text;
  } catch (error) {
    throw toPdfError(error);
  } finally {
    await loadingTask?.destroy?.();
  }
}

export function parseTopDownExpenseRequestText(
  text: string,
  fileName = "Solicitação de Despesa.pdf",
): ExpenseRequestExtractionResult {
  if (!cleanText(text)) {
    throw new ExpenseRequestPdfError("O texto da Solicitação de Despesa está vazio.", "empty_text");
  }

  const lines = getLines(text);
  const warnings: ExpenseRequestExtractionWarning[] = [];
  const normalizedText = normalizeKey(text);

  if (
    !normalizedText.includes("solicitacao") ||
    !normalizedText.includes("despesa") ||
    !normalizedText.includes("unidade orcamentaria")
  ) {
    throw new ExpenseRequestPdfError(
      "O PDF não parece ser uma Solicitação de Despesa TopDown.",
      "unrecognized_sd",
    );
  }

  const organizationCnpj = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/)?.[0] ?? null;
  const organizationName =
    valueAfterLabel(lines, (line) => line.includes("solicitacao de despesa")) ??
    lines.find((line) => normalizeKey(line).startsWith("municipio de ")) ??
    null;
  const budgetUnit = parseBudgetUnit(
    valueAfterLabel(lines, (line) => line.startsWith("unidade orcamentaria")),
  );
  const requestNumber = valueAfterLabel(
    lines,
    (line) => line.includes("n") && line.includes("solicitacao"),
  );
  const issueDate = parseDate(valueAfterLabel(lines, (line) => line.startsWith("data emissao")));
  const processType = valueAfterLabel(
    lines,
    (line) => line === "processo:" || line.startsWith("processo"),
  );
  const object = sectionAfterLabel(lines, (line) => line.startsWith("classificacao"), [
    (line) => line.startsWith("objeto"),
  ]);
  const justification =
    sectionAfterLabel(lines, (line) => line.startsWith("objeto"), [
      (line) => line === "justificativa:" || line.startsWith("justificativa:"),
      (line) => line.startsWith("item descricao"),
      (line) => line.includes("valor total"),
    ]) ??
    sectionAfterLabel(lines, (line) => line.startsWith("justificativa"), [
      (line) => line.startsWith("item descricao"),
      (line) => line.includes("valor total"),
    ]);
  const items = parseItems(lines);
  const item = items[0] ?? parseItem(lines);
  const itemDescription = item.description;
  const totalValue =
    item.totalValue ??
    valueAfterLabel(lines, (line) => line.includes("valor total"))?.match(/\d[\d,.]*/)?.[0] ??
    null;
  const responsible = parseResponsible(lines);

  if (!organizationCnpj) {
    warnings.push("organization_cnpj_missing");
  }

  if (!budgetUnit.budgetUnitCode) {
    warnings.push("budget_unit_code_missing");
  }

  if (!budgetUnit.budgetUnitName) {
    warnings.push("budget_unit_name_missing");
  }

  if (!itemDescription) {
    warnings.push("item_description_missing");
  }

  if (items.length === 0) {
    warnings.push("item_rows_missing");
  }

  if (!totalValue) {
    warnings.push("item_value_missing");
  }

  if (!responsible.responsibleName) {
    warnings.push("responsible_name_missing");
  }

  if (!requestNumber || !issueDate || !processType || !object || !justification) {
    warnings.push("required_field_missing");
  }

  if (!requestNumber || !issueDate || !processType || !object || !justification) {
    throw new ExpenseRequestPdfError(
      "A Solicitação de Despesa foi lida, mas campos obrigatórios não foram encontrados.",
      "missing_required_fields",
    );
  }

  const year = issueDate?.slice(0, 4) ?? new Date().getFullYear().toString();
  const sourceReference = requestNumber ? `SD-${requestNumber}-${year}` : null;
  const suggestions: Partial<ProcessCreationFormValues> = {
    expenseRequestItems: toExpenseRequestFormItems(items, "pdf"),
    sourceKind: "expense_request",
    sourceReference,
    sourceMetadata: {
      extractedFields: {
        budgetUnitCode: budgetUnit.budgetUnitCode,
        budgetUnitName: budgetUnit.budgetUnitName,
        issueDate,
        item,
        itemDescription,
        items,
        object,
        organizationCnpj,
        organizationName,
        processType,
        requestNumber,
        responsibleName: responsible.responsibleName,
        responsibleRole: responsible.responsibleRole,
        totalValue,
      },
      source: {
        fileName,
        label: fileName,
      },
      warnings,
    },
  };

  if (processType) {
    suggestions.type = processType;
  }

  if (sourceReference) {
    suggestions.processNumber = sourceReference;
  }

  suggestions.title = deriveProcessTitlePreview({
    itemDescription,
    object,
    processNumber: sourceReference,
  });

  if (requestNumber) {
    suggestions.externalId = requestNumber;
  }

  if (issueDate) {
    suggestions.issuedAt = normalizeDateInput(issueDate);
  }

  if (object) {
    suggestions.object = object;
  }

  if (justification) {
    suggestions.justification = justification;
  }

  if (responsible.responsibleName) {
    suggestions.responsibleName = responsible.responsibleName;
  }

  return {
    fileName,
    rawText: text,
    suggestions,
    extractedFields: {
      budgetUnitCode: budgetUnit.budgetUnitCode,
      budgetUnitName: budgetUnit.budgetUnitName,
      issueDate,
      itemDescription,
      item,
      items,
      object,
      organizationCnpj,
      organizationName,
      processType,
      requestNumber,
      responsibleName: responsible.responsibleName,
      responsibleRole: responsible.responsibleRole,
      totalValue,
    },
    warnings,
  };
}

export async function extractExpenseRequestFromPdf(file: File, loadPdf?: PdfLoader) {
  const text = await extractTextFromExpenseRequestPdf(file, loadPdf);

  return parseTopDownExpenseRequestText(text, file.name);
}
