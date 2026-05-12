import { and, eq, inArray, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { departments, type documents, processDepartments, processes } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ConflictError } from "../../shared/errors/conflict-error";

export type StoredProcess = typeof processes.$inferSelect;
export type StoredDepartment = typeof departments.$inferSelect;
type StoredProcessDocument = Pick<
  typeof documents.$inferSelect,
  "id" | "status" | "type" | "updatedAt"
>;
export type ExpectedProcessDocumentType = "dfd" | "etp" | "tr" | "minuta";
export type ProcessDocumentProgress = {
  completedCount: number;
  totalRequiredCount: number;
  completedTypes: ExpectedProcessDocumentType[];
  missingTypes: ExpectedProcessDocumentType[];
};

export type ProcessListAggregation = {
  documents: ProcessDocumentProgress;
  listUpdatedAt: Date;
};

export type ProcessDetailDepartment = {
  id: string;
  name: string;
  budgetUnitCode: string | null;
  organizationId: string;
  label: string;
};

export type ProcessDetailDocumentStatus = "concluido" | "em_edicao" | "pendente" | "erro";

export type ProcessDetailDocumentCard = {
  type: ExpectedProcessDocumentType;
  label: string;
  title: string;
  description: string;
  status: ProcessDetailDocumentStatus;
  documentId: string | null;
  lastUpdatedAt: string | null;
  progress: number | null;
  availableActions: {
    create: boolean;
    edit: boolean;
    view: boolean;
  };
};

export const expectedProcessDocumentTypes: ExpectedProcessDocumentType[] = [
  "dfd",
  "etp",
  "tr",
  "minuta",
];

const processDetailDocumentMetadata: Record<
  ExpectedProcessDocumentType,
  {
    label: string;
    title: string;
    description: string;
  }
> = {
  dfd: {
    label: "DFD",
    title: "Documento de Formalização de Demanda",
    description: "Justificativa da necessidade de contratação",
  },
  etp: {
    label: "ETP",
    title: "Estudo Técnico Preliminar",
    description: "Análise técnica e levantamento de soluções",
  },
  tr: {
    label: "TR",
    title: "Termo de Referência",
    description: "Especificações técnicas e requisitos",
  },
  minuta: {
    label: "Minuta",
    title: "Minuta do Contrato",
    description: "Cláusulas e condições contratuais",
  },
};

export function isActorInProcessOrganization(
  actor: Actor,
  process: Pick<StoredProcess, "organizationId">,
) {
  return actor.organizationId !== null && actor.organizationId === process.organizationId;
}

export function getProcessesVisibilityScope(actor: Actor): SQL<unknown> | undefined {
  if (actor.role === "admin") {
    return undefined;
  }

  if (!actor.organizationId) {
    return undefined;
  }

  return eq(processes.organizationId, actor.organizationId);
}

export function isExpectedProcessDocumentType(value: string): value is ExpectedProcessDocumentType {
  return expectedProcessDocumentTypes.includes(value as ExpectedProcessDocumentType);
}

export function serializeProcess(process: StoredProcess, departmentIds: string[]) {
  return {
    id: process.id,
    organizationId: process.organizationId,
    type: process.type,
    processNumber: process.processNumber,
    externalId: process.externalId ?? null,
    issuedAt: process.issuedAt.toISOString(),
    title: deriveConciseProcessTitle({
      title: process.title,
      object: process.object,
      processNumber: process.processNumber,
    }),
    object: process.object,
    justification: process.justification,
    responsibleName: process.responsibleName,
    status: process.status,
    departmentIds,
    sourceKind: process.sourceKind ?? null,
    sourceReference: process.sourceReference ?? null,
    sourceMetadata: process.sourceMetadata ?? null,
    createdAt: process.createdAt.toISOString(),
    updatedAt: process.updatedAt.toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const next = value.trim();

  return next.length > 0 ? next : null;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function capitalizeFirstLetter(value: string) {
  const [first = "", ...rest] = Array.from(value);

  return `${first.toLocaleUpperCase("pt-BR")}${rest.join("")}`;
}

function truncateAtWordBoundary(value: string, maxLength = 90) {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const next = lastSpace >= 40 ? truncated.slice(0, lastSpace) : value.slice(0, maxLength);

  return `${next.trimEnd()}...`;
}

function removeTitleBoilerplate(value: string) {
  return value
    .replace(
      /^(?:contrata[cç][aã]o|aquisi[cç][aã]o)\s+(?:de\s+)?(?:empresa\s+especializada\s+para\s+)?/i,
      "",
    )
    .replace(/^presta[cç][aã]o\s+de\s+servi[cç]os\s+para\s+/i, "Serviços para ")
    .trim();
}

function cutAtNaturalTitleBoundary(value: string) {
  const commaIndex = value.indexOf(",");

  if (commaIndex >= 20) {
    return value.slice(0, commaIndex).trim();
  }

  const patterns = [
    /\s*,\s*para\s+/i,
    /\s*,\s*junt[oa]s?\s+/i,
    /\s*,\s*que\s+/i,
    /\s*,\s*/i,
    /\s+junto\s+aos?\s+/i,
    /\s+junto\s+[àa]s?\s+/i,
    /\s+que\s+ser[aá]\s+/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (typeof match?.index === "number" && match.index >= 20) {
      return value.slice(0, match.index).trim();
    }
  }

  return value;
}

export function deriveConciseProcessTitle({
  itemDescription,
  object,
  processNumber,
  title,
}: {
  itemDescription?: string | null;
  object?: string | null;
  processNumber?: string | null;
  title?: string | null;
}) {
  const explicitTitle = getNullableText(title);

  if (explicitTitle) {
    return truncateAtWordBoundary(explicitTitle);
  }

  const source = firstText(itemDescription, object, processNumber) ?? "Processo";
  const normalized = cleanText(cutAtNaturalTitleBoundary(removeTitleBoilerplate(source)));

  return truncateAtWordBoundary(capitalizeFirstLetter(normalized || source));
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const next = getNullableText(value);

    if (next) {
      return next;
    }
  }

  return null;
}

function getExtractedFields(process: StoredProcess) {
  if (!isRecord(process.sourceMetadata)) {
    return null;
  }

  const extractedFields = process.sourceMetadata.extractedFields;

  if (!isRecord(extractedFields)) {
    return null;
  }

  return extractedFields;
}

function getExtractedValue(process: StoredProcess, fieldPath: string) {
  const extractedFields = getExtractedFields(process);

  if (!extractedFields) {
    return null;
  }

  let current: unknown = extractedFields;

  for (const segment of fieldPath.split(".")) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  if (typeof current === "number" && Number.isFinite(current)) {
    return String(current);
  }

  return getNullableText(current);
}

function normalizeMonetaryNumber(value: string) {
  const sanitized = value.replace(/[^\d,.-]/g, "").replace(/\s+/g, "");

  if (!/\d/.test(sanitized)) {
    return null;
  }

  const lastCommaIndex = sanitized.lastIndexOf(",");
  const lastDotIndex = sanitized.lastIndexOf(".");
  const decimalSeparator =
    lastCommaIndex > lastDotIndex ? "," : lastDotIndex > lastCommaIndex ? "." : null;
  let normalized = sanitized;

  if (decimalSeparator) {
    const decimalIndex = sanitized.lastIndexOf(decimalSeparator);
    const integerPart = sanitized.slice(0, decimalIndex).replace(/[,.]/g, "");
    const decimalPart = sanitized.slice(decimalIndex + 1).replace(/[,.]/g, "");
    normalized = `${integerPart}.${decimalPart}`;
  } else {
    normalized = sanitized.replace(/[,.]/g, "");
  }

  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function compareDepartments(left: StoredDepartment, right: StoredDepartment) {
  return `${left.budgetUnitCode ?? ""}:${left.name}:${left.id}`.localeCompare(
    `${right.budgetUnitCode ?? ""}:${right.name}:${right.id}`,
  );
}

function serializeProcessDetailDepartment(department: StoredDepartment): ProcessDetailDepartment {
  return {
    id: department.id,
    organizationId: department.organizationId,
    name: department.name,
    budgetUnitCode: department.budgetUnitCode,
    label: department.budgetUnitCode
      ? `${department.budgetUnitCode} - ${department.name}`
      : department.name,
  };
}

function mapProcessDetailDocumentStatus(
  status: StoredProcessDocument["status"],
): ProcessDetailDocumentStatus {
  if (status === "completed") {
    return "concluido";
  }

  if (status === "generating") {
    return "em_edicao";
  }

  if (status === "failed") {
    return "erro";
  }

  return "erro";
}

function serializeProcessDetailDocuments(
  documentRows: StoredProcessDocument[],
): ProcessDetailDocumentCard[] {
  const latestDocumentByType = new Map<ExpectedProcessDocumentType, StoredProcessDocument>();

  for (const row of [...documentRows].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime(),
  )) {
    if (!isExpectedProcessDocumentType(row.type) || latestDocumentByType.has(row.type)) {
      continue;
    }

    latestDocumentByType.set(row.type, row);
  }

  return expectedProcessDocumentTypes.map((type) => {
    const metadata = processDetailDocumentMetadata[type];
    const document = latestDocumentByType.get(type);

    if (!document) {
      return {
        type,
        ...metadata,
        status: "pendente",
        documentId: null,
        lastUpdatedAt: null,
        progress: null,
        availableActions: {
          create: true,
          edit: false,
          view: false,
        },
      };
    }

    return {
      type,
      ...metadata,
      status: mapProcessDetailDocumentStatus(document.status),
      documentId: document.id,
      lastUpdatedAt: document.updatedAt.toISOString(),
      progress: null,
      availableActions: {
        create: false,
        edit: true,
        view: true,
      },
    };
  });
}

export function getProcessEstimatedValue(process: StoredProcess) {
  const rawValue = firstText(
    getExtractedValue(process, "totalValue"),
    getExtractedValue(process, "estimatedValue"),
    getExtractedValue(process, "estimateValue"),
    getExtractedValue(process, "contractValue"),
    getExtractedValue(process, "value"),
    getExtractedValue(process, "item.totalValue"),
    getExtractedValue(process, "item.unitValue"),
  );

  if (!rawValue) {
    return null;
  }

  const normalized = normalizeMonetaryNumber(rawValue);

  if (normalized === null || normalized === 0) {
    return null;
  }

  return rawValue;
}

export function serializeProcessDetail(
  process: StoredProcess,
  {
    departmentIds,
    departments,
    documents,
  }: {
    departmentIds: string[];
    departments: StoredDepartment[];
    documents: StoredProcessDocument[];
  },
) {
  const serializedDepartments = [...departments]
    .sort(compareDepartments)
    .map(serializeProcessDetailDepartment);
  const serializedDocuments = serializeProcessDetailDocuments(documents);
  const detailUpdatedAt = [
    process.updatedAt,
    ...departments.map((department) => department.updatedAt),
    ...documents.map((document) => document.updatedAt),
  ].reduce((latest, current) => (current > latest ? current : latest), process.updatedAt);

  return {
    ...serializeProcess(process, departmentIds),
    departments: serializedDepartments,
    estimatedValue: getProcessEstimatedValue(process),
    documents: serializedDocuments,
    detailUpdatedAt: detailUpdatedAt.toISOString(),
  };
}

export function createEmptyProcessListAggregation(process: StoredProcess): ProcessListAggregation {
  return {
    documents: {
      completedCount: 0,
      totalRequiredCount: expectedProcessDocumentTypes.length,
      completedTypes: [],
      missingTypes: [...expectedProcessDocumentTypes],
    },
    listUpdatedAt: process.updatedAt,
  };
}

export function serializeProcessListItem(
  process: StoredProcess,
  departmentIds: string[],
  aggregation: ProcessListAggregation = createEmptyProcessListAggregation(process),
) {
  return {
    ...serializeProcess(process, departmentIds),
    documents: aggregation.documents,
    listUpdatedAt: aggregation.listUpdatedAt.toISOString(),
  };
}

export async function assertDepartmentIdsBelongToOrganization({
  db,
  organizationId,
  departmentIds,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  organizationId: string;
  departmentIds: string[];
}) {
  const rows = await db
    .select({
      id: departments.id,
    })
    .from(departments)
    .where(
      and(eq(departments.organizationId, organizationId), inArray(departments.id, departmentIds)),
    );

  if (rows.length !== departmentIds.length) {
    throw new BadRequestError("Departments must belong to the same organization as the process.");
  }
}

export async function getProcessDepartmentIds({
  db,
  processId,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  processId: string;
}) {
  const links = await db
    .select({
      departmentId: processDepartments.departmentId,
    })
    .from(processDepartments)
    .where(eq(processDepartments.processId, processId));

  return links.map((link) => link.departmentId).sort();
}

export async function getDepartmentIdsByProcessIds({
  db,
  processIds,
}: {
  db: Pick<FastifyInstance["db"], "select">;
  processIds: string[];
}) {
  const departmentIdsByProcessId = new Map<string, string[]>();

  if (processIds.length === 0) {
    return departmentIdsByProcessId;
  }

  const links = await db
    .select({
      processId: processDepartments.processId,
      departmentId: processDepartments.departmentId,
    })
    .from(processDepartments)
    .where(inArray(processDepartments.processId, processIds));

  for (const link of links) {
    const current = departmentIdsByProcessId.get(link.processId) ?? [];
    current.push(link.departmentId);
    departmentIdsByProcessId.set(link.processId, current);
  }

  for (const [processId, departmentIds] of departmentIdsByProcessId.entries()) {
    departmentIdsByProcessId.set(processId, departmentIds.sort());
  }

  return departmentIdsByProcessId;
}

export async function getProcessDetailDepartments({
  db,
  departmentIds,
}: {
  db: Pick<FastifyInstance["db"], "query">;
  departmentIds: string[];
}) {
  if (departmentIds.length === 0) {
    return [];
  }

  return db.query.departments.findMany({
    where: (table, { inArray: includes }) => includes(table.id, departmentIds),
  });
}

export async function getProcessDetailDocuments({
  db,
  processId,
}: {
  db: Pick<FastifyInstance["db"], "query">;
  processId: string;
}) {
  return db.query.documents.findMany({
    where: (table, { eq: equals }) => equals(table.processId, processId),
    orderBy: (table, { desc }) => [desc(table.updatedAt), desc(table.createdAt)],
  });
}

function getDatabaseConflict(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  if ("code" in error && typeof error.code === "string") {
    return error as Record<string, unknown>;
  }

  if ("cause" in error) {
    return getDatabaseConflict(error.cause);
  }

  return null;
}

export function throwIfProcessConflict(error: unknown): never {
  const conflict = getDatabaseConflict(error);

  if (conflict?.code === "23505") {
    const constraint = typeof conflict.constraint === "string" ? conflict.constraint : undefined;

    if (constraint === "processes_organization_process_number_unique") {
      throw new ConflictError("Process number is already in use for this organization.");
    }

    throw new ConflictError("Process conflicts with existing data.");
  }

  throw error;
}
