import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documentGenerationRuns, documents, organizations, processes, users } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { TextGenerationProvider } from "../../shared/text-generation/types";
import { canReadStoredProcess } from "../processes/processes.policies";
import { getProcessDepartmentIds, getProcessItems } from "../processes/processes.shared";
import { createInitialDocumentGenerationPipeline } from "./document-generation-pipeline";
import type { CreateDocumentInput } from "./documents.schemas";
import { getGeneratedDocumentName, serializeDocumentDetail } from "./documents.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  document: CreateDocumentInput;
  scheduleGeneration?: (generationRunId: string) => void;
  textGeneration?: TextGenerationProvider;
  combineWriterHumanizationEnabled?: boolean;
  structuredOutputEnabled?: boolean;
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
    where: eq(users.id, responsibleUserId),
  });

  return user?.name ?? null;
}

export async function createDocument({
  actor,
  db,
  document,
  scheduleGeneration,
  combineWriterHumanizationEnabled = false,
  structuredOutputEnabled = false,
}: Input) {
  const process = await db.query.processes.findFirst({
    where: eq(processes.id, document.processId),
  });

  if (!process) {
    throw new NotFoundError("Process not found.");
  }

  canReadStoredProcess(actor, process);

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, process.organizationId),
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

  const initialPipeline = createInitialDocumentGenerationPipeline({
    departments,
    documentType: document.documentType,
    debugRequested: document.debug,
    instructions: document.instructions,
    organization,
    process,
    processItems,
    responsibleUserName,
  });
  const prompt = initialPipeline.pipeline.prompt;
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
          pipeline: initialPipeline.pipeline,
          pipelineRequired: true,
          processId: process.id,
          organizationId: process.organizationId,
          instructions: document.instructions,
          debugRequested: document.debug,
          combineWriterHumanizationEnabled,
          structuredOutputEnabled,
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

  const serializedDocument = serializeDocumentDetail(createdDocument);

  return document.debug
    ? {
        ...serializedDocument,
        pipelineDebug: initialPipeline.debug,
      }
    : serializedDocument;
}
