import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { documentGenerationRuns, documents } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { TextGenerationProvider } from "../../shared/text-generation/types";
import { TextGenerationError } from "../../shared/text-generation/types";
import { canReadStoredProcess } from "../processes/processes.policies";
import { getProcessDepartmentIds } from "../processes/processes.shared";
import type { CreateDocumentInput } from "./documents.schemas";
import {
  buildDocumentGenerationPrompt,
  getGeneratedDocumentName,
  sanitizeGeneratedDocumentDraft,
  serializeDocumentDetail,
} from "./documents.shared";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  document: CreateDocumentInput;
  textGeneration: TextGenerationProvider;
};

function toTextGenerationError(error: unknown, provider: TextGenerationProvider) {
  if (error instanceof TextGenerationError) {
    return error;
  }

  return new TextGenerationError({
    code: "unknown",
    message: "Unexpected text generation failure.",
    providerKey: provider.providerKey,
    model: provider.model,
    details:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
          }
        : null,
  });
}

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

export async function createDocument({ actor, db, document, textGeneration }: Input) {
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

  const prompt = buildDocumentGenerationPrompt({
    departments,
    documentType: document.documentType,
    instructions: document.instructions,
    organization,
    process,
  });

  return db.transaction(async (tx) => {
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
        responsibles: [process.responsibleName],
      })
      .returning();

    if (!createdDocument) {
      throw new NotFoundError("Document could not be created.");
    }

    const [generationRun] = await tx
      .insert(documentGenerationRuns)
      .values({
        documentId: createdDocument.id,
        providerKey: textGeneration.providerKey,
        model: textGeneration.model,
        status: "generating",
        requestMetadata: {
          documentType: document.documentType,
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

    try {
      const result = await textGeneration.generateText({
        documentType: document.documentType,
        prompt,
        subject: {
          documentId: createdDocument.id,
          organizationId: process.organizationId,
          processId: process.id,
        },
      });
      const draftContent = sanitizeGeneratedDocumentDraft({
        documentType: document.documentType,
        text: result.text,
      });

      const [completedDocument] = await tx
        .update(documents)
        .set({
          status: "completed",
          draftContent,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, createdDocument.id))
        .returning();

      if (generationRun) {
        await tx
          .update(documentGenerationRuns)
          .set({
            providerKey: result.providerKey,
            model: result.model,
            status: "completed",
            responseMetadata: result.responseMetadata,
            finishedAt: new Date(),
          })
          .where(eq(documentGenerationRuns.id, generationRun.id));
      }

      return serializeDocumentDetail(completedDocument ?? createdDocument);
    } catch (error) {
      const generationError = toTextGenerationError(error, textGeneration);
      const [failedDocument] = await tx
        .update(documents)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(documents.id, createdDocument.id))
        .returning();

      if (generationRun) {
        await tx
          .update(documentGenerationRuns)
          .set({
            providerKey: generationError.providerKey,
            model: generationError.model ?? textGeneration.model,
            status: "failed",
            errorCode: generationError.code,
            errorMessage: generationError.message,
            errorDetails: generationError.details,
            finishedAt: new Date(),
          })
          .where(eq(documentGenerationRuns.id, generationRun.id));
      }

      return serializeDocumentDetail(failedDocument ?? createdDocument);
    }
  });
}
