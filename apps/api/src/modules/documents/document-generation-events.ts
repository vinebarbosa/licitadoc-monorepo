import fp from "fastify-plugin";

export type DocumentGenerationEvent =
  | {
      type: "planning";
      documentId: string;
      planningDelta: string;
      planningContent: string;
      status: "generating";
      sequence: number;
      publishedAt: string;
    }
  | {
      type: "snapshot";
      documentId: string;
      content: string;
      status: "generating";
      sequence: number;
      publishedAt: string;
    }
  | {
      type: "chunk";
      documentId: string;
      textDelta: string;
      content: string;
      status: "generating";
      sequence: number;
      publishedAt: string;
    }
  | {
      type: "completed";
      documentId: string;
      content: string;
      status: "completed";
      sequence: number;
      publishedAt: string;
    }
  | {
      type: "failed";
      documentId: string;
      errorCode: string;
      errorMessage: string;
      status: "failed";
      sequence: number;
      publishedAt: string;
    };

type WithoutGenerationEventMetadata<T> = T extends unknown
  ? Omit<T, "publishedAt" | "sequence">
  : never;
type DocumentGenerationEventInput = WithoutGenerationEventMetadata<DocumentGenerationEvent>;

type DocumentGenerationSubscriber = (event: DocumentGenerationEvent) => void;

export type DocumentGenerationEvents = {
  getSnapshot(documentId: string): DocumentGenerationEvent | null;
  getSnapshots(documentId: string): DocumentGenerationEvent[];
  publishChunk(input: { documentId: string; textDelta: string }): void;
  publishCompleted(input: { documentId: string; content: string }): void;
  publishFailed(input: { documentId: string; errorCode: string; errorMessage: string }): void;
  publishPlanning(input: { documentId: string; planningDelta: string }): void;
  subscribe(documentId: string, subscriber: DocumentGenerationSubscriber): () => void;
};

declare module "fastify" {
  interface FastifyInstance {
    documentGenerationEvents: DocumentGenerationEvents;
  }
}

export function createDocumentGenerationEvents(): DocumentGenerationEvents {
  const snapshots = new Map<string, DocumentGenerationEvent>();
  const planningSnapshots = new Map<string, DocumentGenerationEvent>();
  const sequences = new Map<string, number>();
  const subscribers = new Map<string, Set<DocumentGenerationSubscriber>>();

  function publish(event: DocumentGenerationEventInput) {
    const sequence = (sequences.get(event.documentId) ?? 0) + 1;
    const eventWithMetadata = {
      ...event,
      publishedAt: new Date().toISOString(),
      sequence,
    } as DocumentGenerationEvent;

    sequences.set(event.documentId, sequence);
    if (eventWithMetadata.type === "planning") {
      planningSnapshots.set(event.documentId, eventWithMetadata);
    } else {
      snapshots.set(event.documentId, eventWithMetadata);
    }

    for (const subscriber of subscribers.get(event.documentId) ?? []) {
      subscriber(eventWithMetadata);
    }
  }

  return {
    getSnapshot(documentId) {
      return snapshots.get(documentId) ?? null;
    },
    getSnapshots(documentId) {
      const snapshot = snapshots.get(documentId);

      if (snapshot && snapshot.status !== "generating") {
        return [snapshot];
      }

      return [planningSnapshots.get(documentId), snapshot].filter(
        (event): event is DocumentGenerationEvent => Boolean(event),
      );
    },
    publishChunk({ documentId, textDelta }) {
      const previous = snapshots.get(documentId);
      const previousContent =
        previous && "content" in previous && previous.status === "generating"
          ? previous.content
          : "";
      const content = `${previousContent}${textDelta}`;

      publish({
        type: "chunk",
        documentId,
        textDelta,
        content,
        status: "generating",
      });
    },
    publishPlanning({ documentId, planningDelta }) {
      const previous = planningSnapshots.get(documentId);
      const previousContent =
        previous && previous.type === "planning" && previous.status === "generating"
          ? previous.planningContent
          : "";
      const planningContent = `${previousContent}${planningDelta}`;

      publish({
        type: "planning",
        documentId,
        planningDelta,
        planningContent,
        status: "generating",
      });
    },
    publishCompleted({ documentId, content }) {
      publish({
        type: "completed",
        documentId,
        content,
        status: "completed",
      });
    },
    publishFailed({ documentId, errorCode, errorMessage }) {
      publish({
        type: "failed",
        documentId,
        errorCode,
        errorMessage,
        status: "failed",
      });
    },
    subscribe(documentId, subscriber) {
      const documentSubscribers =
        subscribers.get(documentId) ?? new Set<DocumentGenerationSubscriber>();
      documentSubscribers.add(subscriber);
      subscribers.set(documentId, documentSubscribers);

      return () => {
        documentSubscribers.delete(subscriber);

        if (documentSubscribers.size === 0) {
          subscribers.delete(documentId);
        }
      };
    },
  };
}

export const registerDocumentGenerationEventsPlugin = fp(async (app) => {
  app.decorate("documentGenerationEvents", createDocumentGenerationEvents());
});
