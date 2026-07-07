import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import type { Actor } from "../../authorization/actor";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { normalizeAiUsageRunMetadata } from "./ai-usage-normalization";
import { type AiUsageJoinedRunRow, buildAiUsageDashboard, getAiUsage } from "./get-ai-usage";

const NOW = new Date("2026-05-26T12:00:00.000Z");
const ADMIN_ACTOR: Actor = {
  id: "admin-user",
  role: "admin",
  organizationId: null,
  onboardingStatus: "complete",
};

function createRunRow(overrides: Partial<AiUsageJoinedRunRow> = {}): AiUsageJoinedRunRow {
  return {
    createdAt: new Date("2026-05-20T10:00:00.000Z"),
    documentId: "document-1",
    documentName: "Termo de Referencia",
    documentOrganizationId: "organization-1",
    documentType: "tr",
    errorCode: null,
    errorMessage: null,
    fallbackDocumentType: "tr",
    fallbackOrganizationId: "organization-1",
    finishedAt: new Date("2026-05-20T10:01:00.000Z"),
    id: "run-1",
    model: "gpt-5.4",
    organizationId: "organization-1",
    organizationName: "Prefeitura Teste",
    processId: "process-1",
    processNumber: "PROC-2026-001",
    processObject: "Aquisicao de materiais",
    processTitle: "Materiais de expediente",
    providerKey: "openai",
    requestMetadata: {
      documentType: "tr",
      organizationId: "organization-1",
      processId: "process-1",
    },
    responseMetadata: {
      pipeline: {
        callCount: 2,
        totalCachedInputTokens: 100,
        totalCostUsd: 0.42,
        totalInputTokens: 1_000,
        totalOutputTokens: 300,
        totalTokens: 1_300,
      },
    },
    startedAt: new Date("2026-05-20T10:00:00.000Z"),
    status: "completed",
    ...overrides,
  };
}

function createDbReturning(rows: AiUsageJoinedRunRow[]) {
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    orderBy: async () =>
      rows.map((row) => ({
        ...row,
        fallbackDocumentType: row.requestMetadata,
        fallbackOrganizationId: row.requestMetadata,
      })),
    where: () => chain,
  };

  return {
    select: () => chain,
  };
}

describe("normalizeAiUsageRunMetadata", () => {
  it("prefers pipeline cost and token aggregates", () => {
    const metadata = normalizeAiUsageRunMetadata({
      createdAt: new Date("2026-05-20T10:00:00.000Z"),
      documentOrganizationId: "organization-1",
      documentType: "tr",
      fallbackDocumentType: null,
      fallbackOrganizationId: null,
      finishedAt: new Date("2026-05-20T10:01:00.000Z"),
      requestMetadata: {},
      responseMetadata: {
        costUsd: 99,
        pipeline: {
          callCount: 3,
          totalCachedInputTokens: 25,
          totalCostUsd: 0.5,
          totalInputTokens: 100,
          totalOutputTokens: 40,
          totalTokens: 140,
        },
        usage: {
          input_tokens: 5,
          output_tokens: 5,
          total_tokens: 10,
        },
      },
      startedAt: new Date("2026-05-20T10:00:00.000Z"),
    });

    assert.equal(metadata.costUsd, 0.5);
    assert.equal(metadata.costKnown, true);
    assert.equal(metadata.callCount, 3);
    assert.equal(metadata.usage.input_tokens, 100);
    assert.equal(metadata.usage.output_tokens, 40);
    assert.equal(metadata.usage.input_tokens_details.cached_tokens, 25);
  });

  it("falls back to final-call metadata", () => {
    const metadata = normalizeAiUsageRunMetadata({
      createdAt: new Date("2026-05-20T10:00:00.000Z"),
      documentOrganizationId: null,
      documentType: null,
      fallbackDocumentType: null,
      fallbackOrganizationId: null,
      finishedAt: null,
      requestMetadata: {
        documentType: "dfd",
        organizationId: "organization-from-request",
      },
      responseMetadata: {
        costUsd: 0.01,
        usage: {
          input_tokens: 80,
          input_tokens_details: {
            cached_tokens: 20,
          },
          output_tokens: 10,
          total_tokens: 90,
        },
      },
      startedAt: new Date("2026-05-20T10:00:00.000Z"),
    });

    assert.equal(metadata.costUsd, 0.01);
    assert.equal(metadata.callCount, 1);
    assert.equal(metadata.documentType, "dfd");
    assert.equal(metadata.organizationId, "organization-from-request");
    assert.equal(metadata.occurredAt.toISOString(), "2026-05-20T10:00:00.000Z");
  });

  it("keeps zero cost distinct from unknown cost", () => {
    const zeroCost = normalizeAiUsageRunMetadata({
      createdAt: NOW,
      documentOrganizationId: null,
      documentType: null,
      fallbackDocumentType: null,
      fallbackOrganizationId: null,
      finishedAt: null,
      requestMetadata: {},
      responseMetadata: {
        costUsd: 0,
      },
      startedAt: NOW,
    });
    const unknownCost = normalizeAiUsageRunMetadata({
      createdAt: NOW,
      documentOrganizationId: null,
      documentType: null,
      fallbackDocumentType: null,
      fallbackOrganizationId: null,
      finishedAt: null,
      requestMetadata: {},
      responseMetadata: {},
      startedAt: NOW,
    });

    assert.equal(zeroCost.costKnown, true);
    assert.equal(zeroCost.costUsd, 0);
    assert.equal(unknownCost.costKnown, false);
    assert.equal(unknownCost.costUsd, null);
    assert.equal(unknownCost.usage.total_tokens, 0);
  });
});

describe("buildAiUsageDashboard", () => {
  it("aggregates default-period summary, trend, breakdowns, and rows", () => {
    const dashboard = buildAiUsageDashboard({
      now: NOW,
      rows: [
        createRunRow(),
        createRunRow({
          documentId: "document-2",
          id: "run-2",
          responseMetadata: {
            costUsd: 0.08,
            usage: {
              input_tokens: 500,
              output_tokens: 100,
              total_tokens: 600,
            },
          },
        }),
        createRunRow({
          documentId: "document-3",
          finishedAt: new Date("2026-05-21T10:01:00.000Z"),
          id: "run-3",
          responseMetadata: {},
          startedAt: new Date("2026-05-21T10:00:00.000Z"),
          status: "failed",
        }),
        createRunRow({
          finishedAt: new Date("2026-04-01T10:01:00.000Z"),
          id: "old-run",
          startedAt: new Date("2026-04-01T10:00:00.000Z"),
        }),
      ],
    });

    assert.equal(dashboard.summary.runCount, 3);
    assert.equal(dashboard.summary.completedRunCount, 2);
    assert.equal(dashboard.summary.failedRunCount, 1);
    assert.equal(dashboard.summary.generatedDocumentCount, 2);
    assert.equal(dashboard.summary.knownCostUsd, 0.5);
    assert.equal(dashboard.summary.unknownCostRunCount, 1);
    assert.equal(dashboard.summary.totalTokens, 1_900);
    assert.equal(dashboard.trend.length, 31);
    assert.equal(dashboard.trend[0]?.date, "2026-04-26");
    assert.equal(dashboard.trend.at(-1)?.date, "2026-05-26");
    assert.equal(dashboard.trend.find((point) => point.date === "2026-05-21")?.failedRunCount, 1);
    assert.equal(dashboard.breakdowns.models[0]?.key, "gpt-5.4");
    assert.equal(dashboard.recentRuns.items[0]?.id, "run-3");
  });

  it("applies filters, cost sorting, and pagination", () => {
    const dashboard = buildAiUsageDashboard({
      now: NOW,
      query: {
        documentType: "tr",
        model: "gpt-5.4",
        organizationId: "organization-1",
        page: 1,
        pageSize: 1,
        sort: "cost_desc",
      },
      rows: [
        createRunRow({ id: "low-cost", responseMetadata: { costUsd: 0.1 } }),
        createRunRow({ id: "high-cost", responseMetadata: { costUsd: 0.9 } }),
        createRunRow({
          documentType: "dfd",
          fallbackDocumentType: "dfd",
          id: "filtered-out",
          responseMetadata: { costUsd: 1 },
        }),
      ],
    });

    assert.equal(dashboard.summary.runCount, 2);
    assert.equal(dashboard.recentRuns.total, 2);
    assert.equal(dashboard.recentRuns.totalPages, 2);
    assert.equal(dashboard.recentRuns.items.length, 1);
    assert.equal(dashboard.recentRuns.items[0]?.id, "high-cost");
    assert.equal(dashboard.filters.documentType, "tr");
  });

  it("filters rows by search text across document and process fields", () => {
    const dashboard = buildAiUsageDashboard({
      now: NOW,
      query: {
        search: "licitacao",
      },
      rows: [
        createRunRow({
          documentName: "Documento de Licitacao",
          id: "matched-by-document",
        }),
        createRunRow({
          documentName: "Termo comum",
          id: "matched-by-process",
          processTitle: "Contratacao por licitacao",
        }),
        createRunRow({
          documentName: "Outro documento",
          id: "filtered-out",
          processTitle: "Compra direta",
        }),
      ],
    });

    assert.equal(dashboard.summary.runCount, 2);
    assert.deepEqual(
      dashboard.recentRuns.items.map((item) => item.id),
      ["matched-by-document", "matched-by-process"],
    );
    assert.equal(dashboard.filters.search, "licitacao");
  });
});

describe("getAiUsage", () => {
  it("rejects non-admin actors", async () => {
    await expect(
      getAiUsage({
        actor: {
          ...ADMIN_ACTOR,
          organizationId: "organization-1",
          role: "member",
        },
        db: createDbReturning([]) as never,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns dashboard data for admin actors", async () => {
    const dashboard = await getAiUsage({
      actor: ADMIN_ACTOR,
      db: createDbReturning([createRunRow()]) as never,
      now: NOW,
      query: {
        from: "2026-05-01T00:00:00.000Z",
        to: "2026-05-26T12:00:00.000Z",
      },
    });

    assert.equal(dashboard.summary.runCount, 1);
    assert.equal(dashboard.recentRuns.items[0]?.organizationName, "Prefeitura Teste");
  });
});
