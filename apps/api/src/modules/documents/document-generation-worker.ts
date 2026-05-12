import { and, eq } from "drizzle-orm";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { documentGenerationRuns, documents } from "../../db";
import type {
  GeneratedDocumentType,
  TextGenerationProvider,
} from "../../shared/text-generation/types";
import {
  supportedGeneratedDocumentTypes,
  TextGenerationError,
} from "../../shared/text-generation/types";
import type { DocumentGenerationEvents } from "./document-generation-events";
import { sanitizeGeneratedDocumentDraft } from "./documents.shared";

type AppDatabase = FastifyInstance["db"];

type DocumentGenerationQueue = {
  recoverPending(): Promise<void>;
  schedule(generationRunId: string): void;
};

declare module "fastify" {
  interface FastifyInstance {
    documentGenerationQueue: DocumentGenerationQueue;
  }
}

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

function getGenerationInput(metadata: Record<string, unknown>) {
  const documentType = metadata.documentType;
  const prompt = metadata.prompt;
  const processId = metadata.processId;
  const organizationId = metadata.organizationId;

  if (
    typeof documentType !== "string" ||
    !supportedGeneratedDocumentTypes.includes(documentType as GeneratedDocumentType) ||
    typeof prompt !== "string" ||
    typeof processId !== "string" ||
    typeof organizationId !== "string"
  ) {
    return null;
  }

  return {
    documentType: documentType as GeneratedDocumentType,
    organizationId,
    processId,
    prompt,
  };
}

async function markGenerationFailed({
  db,
  documentId,
  error,
  generationEvents,
  generationRunId,
  textGeneration,
}: {
  db: AppDatabase;
  documentId: string;
  error: unknown;
  generationEvents?: DocumentGenerationEvents;
  generationRunId: string;
  textGeneration: TextGenerationProvider;
}) {
  const generationError = toTextGenerationError(error, textGeneration);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(documents)
      .set({
        status: "failed",
        updatedAt: now,
      })
      .where(and(eq(documents.id, documentId), eq(documents.status, "generating")));

    await tx
      .update(documentGenerationRuns)
      .set({
        providerKey: generationError.providerKey,
        model: generationError.model ?? textGeneration.model,
        status: "failed",
        errorCode: generationError.code,
        errorMessage: generationError.message,
        errorDetails: generationError.details,
        finishedAt: now,
      })
      .where(
        and(
          eq(documentGenerationRuns.id, generationRunId),
          eq(documentGenerationRuns.status, "generating"),
        ),
      );
  });

  generationEvents?.publishFailed({
    documentId,
    errorCode: generationError.code,
    errorMessage: generationError.message,
  });
}

export async function executeDocumentGeneration({
  db,
  generationEvents,
  generationRunId,
  textGeneration,
}: {
  db: AppDatabase;
  generationEvents?: DocumentGenerationEvents;
  generationRunId: string;
  textGeneration: TextGenerationProvider;
}) {
  const generationRun = await db.query.documentGenerationRuns.findFirst({
    where: (table, { eq: equals }) => equals(table.id, generationRunId),
  });

  if (!generationRun || generationRun.status !== "generating") {
    return;
  }

  const document = await db.query.documents.findFirst({
    where: (table, { eq: equals }) => equals(table.id, generationRun.documentId),
  });

  if (!document || document.status !== "generating") {
    return;
  }

  const input = getGenerationInput(generationRun.requestMetadata);

  if (!input) {
    await markGenerationFailed({
      db,
      documentId: document.id,
      error: new TextGenerationError({
        code: "invalid_request",
        message: "Document generation run is missing persisted request metadata.",
        providerKey: textGeneration.providerKey,
        model: textGeneration.model,
      }),
      generationEvents,
      generationRunId: generationRun.id,
      textGeneration,
    });
    return;
  }

  try {
    const result = await textGeneration.generateText({
      documentType: input.documentType,
      prompt: input.prompt,
      subject: {
        documentId: document.id,
        organizationId: input.organizationId,
        processId: input.processId,
      },
      onChunk: (chunk) => {
        if (chunk.textDelta.length > 0) {
          generationEvents?.publishChunk({
            documentId: document.id,
            textDelta: chunk.textDelta,
          });
        }
      },
      onPlanningChunk: (chunk) => {
        if (chunk.planningDelta.length > 0) {
          generationEvents?.publishPlanning({
            documentId: document.id,
            planningDelta: chunk.planningDelta,
          });
        }
      },
    });
    const draftContent = sanitizeGeneratedDocumentDraft({
      documentType: input.documentType,
      text: result.text,
    });
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({
          status: "completed",
          draftContent,
          updatedAt: now,
        })
        .where(and(eq(documents.id, document.id), eq(documents.status, "generating")));

      await tx
        .update(documentGenerationRuns)
        .set({
          providerKey: result.providerKey,
          model: result.model,
          status: "completed",
          responseMetadata: result.responseMetadata,
          finishedAt: now,
        })
        .where(
          and(
            eq(documentGenerationRuns.id, generationRun.id),
            eq(documentGenerationRuns.status, "generating"),
          ),
        );
    });

    generationEvents?.publishCompleted({
      documentId: document.id,
      content: draftContent,
    });
  } catch (error) {
    await markGenerationFailed({
      db,
      documentId: document.id,
      error,
      generationEvents,
      generationRunId: generationRun.id,
      textGeneration,
    });
  }
}

export function createDocumentGenerationQueue({
  db,
  generationEvents,
  logger,
  textGeneration,
}: {
  db: AppDatabase;
  generationEvents?: DocumentGenerationEvents;
  logger?: FastifyBaseLogger;
  textGeneration: TextGenerationProvider;
}): DocumentGenerationQueue {
  const scheduled = new Set<string>();

  function schedule(generationRunId: string) {
    if (scheduled.has(generationRunId)) {
      return;
    }

    scheduled.add(generationRunId);
    setTimeout(() => {
      void executeDocumentGeneration({
        db,
        generationEvents,
        generationRunId,
        textGeneration,
      })
        .catch((error) => {
          logger?.error({ error, generationRunId }, "Document generation job failed.");
        })
        .finally(() => {
          scheduled.delete(generationRunId);
        });
    }, 0);
  }

  async function recoverPending() {
    const pendingRuns = await db.query.documentGenerationRuns.findMany({
      where: (table, { eq: equals }) => equals(table.status, "generating"),
    });

    for (const generationRun of pendingRuns) {
      schedule(generationRun.id);
    }
  }

  return {
    recoverPending,
    schedule,
  };
}

export const registerDocumentGenerationQueuePlugin = fp(async (app) => {
  const queue = createDocumentGenerationQueue({
    db: app.db,
    generationEvents: app.documentGenerationEvents,
    logger: app.log,
    textGeneration: app.textGeneration,
  });

  app.decorate("documentGenerationQueue", queue);

  app.addHook("onReady", async () => {
    await queue.recoverPending();
  });
});
