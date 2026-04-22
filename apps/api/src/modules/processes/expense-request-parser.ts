import { BadRequestError } from "../../shared/errors/bad-request-error";

export type ExpenseRequestItem = {
  code: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitValue: string | null;
  totalValue: string | null;
};

export type ExpenseRequestProcessContext = {
  budgetUnitCode: string | null;
  budgetUnitName: string | null;
  issueDate: string;
  item: ExpenseRequestItem;
  object: string;
  organizationCnpj: string | null;
  organizationName: string | null;
  processType: string;
  requestNumber: string;
  responsibleName: string | null;
  responsibleRole: string | null;
  sourceReference: string;
  totalValue: string | null;
  justification: string;
  warnings: string[];
};

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

  return `${year}-${month}-${day}T00:00:00.000Z`;
}

function parseItem(lines: string[]): ExpenseRequestItem {
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
  const valuesMatch = itemText.match(/\b(\d+)\s+([\d,.]+)\s+([\d,.]+)\s*([A-Z]+)\b/);
  const beforeValues = itemText.slice(0, valuesMatch?.index ?? itemText.length);
  const codeMatches = Array.from(beforeValues.matchAll(/\b(\d{4,})\b/g));
  const codeMatch = codeMatches.at(-1);
  const descriptionEnd = codeMatch?.index ?? beforeValues.length;

  return {
    code: codeMatch?.[1] ?? null,
    description: cleanText(itemText.slice(0, descriptionEnd)) || null,
    quantity: valuesMatch?.[1] ?? null,
    unitValue: valuesMatch?.[2] ?? null,
    totalValue: valuesMatch?.[3] ?? null,
    unit: valuesMatch?.[4] ?? null,
  };
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

function requireField<T>(value: T | null, fieldName: string): T {
  if (value == null || (typeof value === "string" && cleanText(value).length === 0)) {
    throw new BadRequestError(`${fieldName} is required in expense request text.`);
  }

  return value;
}

export function parseExpenseRequestText(text: string): ExpenseRequestProcessContext {
  if (!cleanText(text)) {
    throw new BadRequestError("Expense request text is required.");
  }

  const lines = getLines(text);
  const warnings: string[] = [];
  const cnpj = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/)?.[0] ?? null;
  const organizationName =
    valueAfterLabel(lines, (line) => line.includes("solicitacao de despesa")) ??
    lines.find((line) => normalizeKey(line).startsWith("municipio de ")) ??
    null;
  const budgetUnit = parseBudgetUnit(
    valueAfterLabel(lines, (line) => line.startsWith("unidade orcamentaria")),
  );
  const requestNumber = requireField(
    valueAfterLabel(lines, (line) => line.includes("n") && line.includes("solicitacao")),
    "Expense request number",
  );
  const issueDate = requireField(
    parseDate(valueAfterLabel(lines, (line) => line.startsWith("data emissao"))),
    "Expense request issue date",
  );
  const processType = requireField(
    valueAfterLabel(lines, (line) => line === "processo:" || line.startsWith("processo")),
    "Expense request process type",
  );
  const object = requireField(
    sectionAfterLabel(lines, (line) => line.startsWith("classificacao"), [
      (line) => line.startsWith("objeto"),
    ]),
    "Expense request object",
  );
  const justification = requireField(
    sectionAfterLabel(lines, (line) => line.startsWith("objeto"), [
      (line) => line.startsWith("justificativa"),
    ]),
    "Expense request justification",
  );
  const item = parseItem(lines);
  const responsible = parseResponsible(lines);
  const totalValue =
    valueAfterLabel(lines, (line) => line.includes("valor total"))?.match(/[\d,.]+/)?.[0] ?? null;

  if (!cnpj) {
    warnings.push("organization_cnpj_missing");
  }

  if (!budgetUnit.budgetUnitCode) {
    warnings.push("budget_unit_code_missing");
  }

  if (!budgetUnit.budgetUnitName) {
    warnings.push("budget_unit_name_missing");
  }

  if (!item.description) {
    warnings.push("item_description_missing");
  }

  if (!item.totalValue && !totalValue) {
    warnings.push("item_value_missing");
  }

  if (!responsible.responsibleName) {
    warnings.push("responsible_name_missing");
  }

  const year = issueDate.slice(0, 4);

  return {
    budgetUnitCode: budgetUnit.budgetUnitCode,
    budgetUnitName: budgetUnit.budgetUnitName,
    issueDate,
    item,
    object,
    organizationCnpj: cnpj,
    organizationName,
    processType,
    requestNumber,
    responsibleName: responsible.responsibleName,
    responsibleRole: responsible.responsibleRole,
    sourceReference: `SD-${requestNumber}-${year}`,
    totalValue,
    justification,
    warnings,
  };
}
