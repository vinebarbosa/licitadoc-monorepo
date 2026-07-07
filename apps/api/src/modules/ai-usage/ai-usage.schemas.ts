import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_DATE_TIME,
  OPENAPI_EXAMPLE_UUID,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";

const aiUsageStatusSchema = z.enum(["generating", "completed", "failed"]);

export const aiUsageQuerySchema = z.object({
  documentType: withOpenApiExample(z.string().trim().min(1).optional(), "tr"),
  from: withOpenApiExample(
    z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "from must be a valid date.",
      })
      .optional(),
    OPENAPI_EXAMPLE_DATE_TIME,
  ),
  model: withOpenApiExample(z.string().trim().min(1).optional(), "gpt-5.4"),
  organizationId: withOpenApiExample(openApiUuidSchema().optional(), OPENAPI_EXAMPLE_UUID),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  providerKey: withOpenApiExample(z.string().trim().min(1).optional(), "openai"),
  search: withOpenApiExample(z.string().trim().optional(), "PROC-2026"),
  sort: z.enum(["recent", "cost_desc"]).optional(),
  status: aiUsageStatusSchema.optional(),
  to: withOpenApiExample(
    z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "to must be a valid date.",
      })
      .optional(),
    OPENAPI_EXAMPLE_DATE_TIME,
  ),
});

export type AiUsageQuery = z.infer<typeof aiUsageQuerySchema>;

const aiUsageAppliedFiltersSchema = z.object({
  documentType: z.string().nullable(),
  from: z.string(),
  model: z.string().nullable(),
  organizationId: z.string().nullable(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  providerKey: z.string().nullable(),
  search: z.string().nullable(),
  sort: z.enum(["recent", "cost_desc"]),
  status: aiUsageStatusSchema.nullable(),
  to: z.string(),
});

const aiUsageSummarySchema = z.object({
  averageCostPerCompletedDocumentUsd: z.number().nullable(),
  cacheInputTokenShare: z.number().nullable(),
  completedRunCount: z.number().int().nonnegative(),
  failedRunCount: z.number().int().nonnegative(),
  failureRate: z.number().nullable(),
  generatedDocumentCount: z.number().int().nonnegative(),
  knownCostUsd: z.number().nonnegative(),
  runCount: z.number().int().nonnegative(),
  totalCachedInputTokens: z.number().int().nonnegative(),
  totalInputTokens: z.number().int().nonnegative(),
  totalOutputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  unknownCostRunCount: z.number().int().nonnegative(),
});

const aiUsageTrendPointSchema = z.object({
  costUsd: z.number().nonnegative(),
  date: z.string(),
  failedRunCount: z.number().int().nonnegative(),
  runCount: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

const aiUsageBreakdownItemSchema = z.object({
  key: z.string(),
  knownCostUsd: z.number().nonnegative(),
  label: z.string(),
  runCount: z.number().int().nonnegative(),
  shareOfKnownCost: z.number().nullable(),
  totalTokens: z.number().int().nonnegative(),
  unknownCostRunCount: z.number().int().nonnegative(),
});

const aiUsageRunSchema = z.object({
  callCount: z.number().int().nonnegative(),
  costKnown: z.boolean(),
  costUsd: z.number().nullable(),
  documentId: z.string(),
  documentName: z.string(),
  documentType: z.string(),
  durationMs: z.number().int().nonnegative().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  finishedAt: z.string().nullable(),
  id: z.string(),
  model: z.string(),
  organizationId: z.string().nullable(),
  organizationName: z.string(),
  processId: z.string().nullable(),
  processLabel: z.string().nullable(),
  providerKey: z.string(),
  startedAt: z.string(),
  status: z.string(),
  totalCachedInputTokens: z.number().int().nonnegative(),
  totalInputTokens: z.number().int().nonnegative(),
  totalOutputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

const aiUsageRunsSchema = z.object({
  items: z.array(aiUsageRunSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const aiUsageResponseSchema = z.object({
  breakdowns: z.object({
    documentTypes: z.array(aiUsageBreakdownItemSchema),
    models: z.array(aiUsageBreakdownItemSchema),
    organizations: z.array(aiUsageBreakdownItemSchema),
    providers: z.array(aiUsageBreakdownItemSchema),
    statuses: z.array(aiUsageBreakdownItemSchema),
  }),
  filters: aiUsageAppliedFiltersSchema,
  recentRuns: aiUsageRunsSchema,
  summary: aiUsageSummarySchema,
  trend: z.array(aiUsageTrendPointSchema),
});

export const getAiUsageSchema = {
  tags: ["AI Usage"],
  summary: "Get admin AI usage dashboard metrics",
  querystring: aiUsageQuerySchema,
  response: {
    200: aiUsageResponseSchema,
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;
