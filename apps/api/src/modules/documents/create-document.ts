import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documentGenerationRuns, documents } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { TextGenerationProvider } from "../../shared/text-generation/types";
import { canReadStoredProcess } from "../processes/processes.policies";
import { getProcessDepartmentIds, getProcessItems } from "../processes/processes.shared";
import type { CreateDocumentInput } from "./documents.schemas";
import {
  buildDocumentGenerationPrompt,
  getGeneratedDocumentName,
  serializeDocumentDetail,
} from "./documents.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  document: CreateDocumentInput;
  scheduleGeneration?: (generationRunId: string) => void;
  textGeneration?: TextGenerationProvider;
};

async function loadProcessDepartments({
  db,
  processId,
}: {
  db: FastifyInstance["db"];
  processId: string;
}) {
  const departmentIds = await getProcessDepartmentIds({ db, processId });

  if (departmentIds.length === 0) {
    return [];
  }

  const rows = await db.query.departments.findMany({
    where: (table, { inArray }) => inArray(table.id, departmentIds),
  });
  const rowsById = new Map(rows.map((department) => [department.id, department]));

  return departmentIds
    .map((departmentId) => rowsById.get(departmentId) ?? null)
    .filter((department): department is NonNullable<typeof department> => department !== null);
}

async function loadResponsibleUserName({
  db,
  responsibleUserId,
}: {
  db: FastifyInstance["db"];
  responsibleUserId: string | null;
}) {
  if (!responsibleUserId) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: (table, { eq: equals }) => equals(table.id, responsibleUserId),
  });

  return user?.name ?? null;
}

export async function createDocument({ actor, db, document, scheduleGeneration }: Input) {
  const process = await db.query.processes.findFirst({
    where: (table, { eq: equals }) => equals(table.id, document.processId),
  });

  if (!process) {
    throw new NotFoundError("Process not found.");
  }

  canReadStoredProcess(actor, process);

  const organization = await db.query.organizations.findFirst({
    where: (table, { eq: equals }) => equals(table.id, process.organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }
  const departments = await loadProcessDepartments({
    db,
    processId: process.id,
  });
  const processItems = await getProcessItems({
    db,
    processId: process.id,
  });
  const responsibleUserName = await loadResponsibleUserName({
    db,
    responsibleUserId: process.responsibleUserId,
  });

  const prompt = buildDocumentGenerationPrompt({
    departments,
    documentType: document.documentType,
    instructions: document.instructions,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const responsibleDisplayName = responsibleUserName ?? process.responsibleName;

  const { createdDocument, generationRunId } = await db.transaction(async (tx) => {
    const [createdDocument] = await tx
      .insert(documents)
      .values({
        organizationId: process.organizationId,
        processId: process.id,
        name: document.name ?? getGeneratedDocumentName(document.documentType, process),
        type: document.documentType,
        status: "generating",
        draftContent: null,
        storageKey: null,
        responsibles: [responsibleDisplayName],
      })
      .returning();

    if (!createdDocument) {
      throw new NotFoundError("Document could not be created.");
    }

    const [generationRun] = await tx
      .insert(documentGenerationRuns)
      .values({
        documentId: createdDocument.id,
        providerKey: "pending",
        model: "pending",
        status: "generating",
        requestMetadata: {
          documentType: document.documentType,
          prompt,
          processId: process.id,
          organizationId: process.organizationId,
          instructions: document.instructions,
        },
        responseMetadata: null,
        errorCode: null,
        errorMessage: null,
        errorDetails: null,
      })
      .returning();

    return {
      createdDocument,
      generationRunId: generationRun?.id ?? null,
    };
  });

  if (generationRunId) {
    scheduleGeneration?.(generationRunId);
  }

  return serializeDocumentDetail(createdDocument);
}
