import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_TEXT,
  OPENAPI_EXAMPLE_UUID,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";
import { supportedGeneratedDocumentTypes } from "../../shared/text-generation/types";

function normalizeNullableOptionalText(value?: string | null) {
  if (value == null) {
    return null;
  }

  const next = value.trim();

  return next ? next : null;
}

export const documentTypeSchema = z.enum(supportedGeneratedDocumentTypes).meta({
  example: "dfd",
});

export const documentStatusSchema = z.enum(["generating", "completed", "failed"]).meta({
  example: "completed",
});

const documentSummarySchema = z.object({
  id: openApiUuidSchema(),
  name: z.string(),
  organizationId: openApiUuidSchema(),
  processId: openApiUuidSchema(),
  processNumber: z.string().nullable(),
  type: z.string(),
  status: z.string(),
  responsibles: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const documentDetailSchema = documentSummarySchema.extend({
  draftContent: z.string().nullable(),
  storageKey: z.string().nullable(),
  responsibles: z.array(z.string()),
});

export const documentParamsSchema = z.object({
  documentId: openApiUuidSchema(),
});

export const createDocumentBodySchema = withOpenApiExample(
  z
    .object({
      processId: openApiUuidSchema(),
      documentType: documentTypeSchema,
      name: withOpenApiExample(
        z.string().nullable().optional().transform(normalizeNullableOptionalText),
        "DFD - PE-2024-045",
      ),
      instructions: withOpenApiExample(
        z.string().nullable().optional().transform(normalizeNullableOptionalText),
        OPENAPI_EXAMPLE_TEXT,
      ),
    })
    .strict(),
  {
    processId: OPENAPI_EXAMPLE_UUID,
    documentType: "dfd",
    name: null,
    instructions: "Priorizar linguagem objetiva para avaliacao preliminar.",
  },
);

export type CreateDocumentInput = z.output<typeof createDocumentBodySchema>;

const documentAdjustmentSelectionContextSchema = z
  .object({
    prefix: withOpenApiExample(z.string().max(500).optional(), "## 2. CONTEXTO"),
    suffix: withOpenApiExample(z.string().max(500).optional(), "Solicitante:"),
  })
  .strict()
  .optional();

export const documentAdjustmentSourceTargetSchema = z
  .object({
    start: withOpenApiExample(z.number().int().min(0), 42),
    end: withOpenApiExample(z.number().int().min(0), 89),
    sourceText: withOpenApiExample(z.string().min(1), OPENAPI_EXAMPLE_TEXT),
  })
  .strict();

export const suggestDocumentTextAdjustmentBodySchema = withOpenApiExample(
  z
    .object({
      selectedText: withOpenApiExample(z.string().min(1).max(4000), OPENAPI_EXAMPLE_TEXT),
      instruction: withOpenApiExample(
        z.string().min(1).max(1200),
        "Deixe este trecho mais objetivo e formal.",
      ),
      selectionContext: documentAdjustmentSelectionContextSchema,
    })
    .strict(),
  {
    selectedText: "A contratação se faz necessária para atender à demanda apresentada.",
    instruction: "Deixe mais objetivo, mantendo o tom formal.",
    selectionContext: {
      prefix: "## 2. CONTEXTO E NECESSIDADE DA DEMANDA",
      suffix: "## 3. OBJETO DA CONTRATAÇÃO",
    },
  },
);

export const applyDocumentTextAdjustmentBodySchema = withOpenApiExample(
  z
    .object({
      sourceTarget: documentAdjustmentSourceTargetSchema,
      replacementText: withOpenApiExample(z.string().min(1).max(6000), OPENAPI_EXAMPLE_TEXT),
      sourceContentHash: withOpenApiExample(z.string().min(1).max(128), "sha256:3b6f7d0b4c2e1a9f"),
    })
    .strict(),
  {
    sourceTarget: {
      start: 42,
      end: 89,
      sourceText: "A contratação se faz necessária para atender à demanda apresentada.",
    },
    replacementText:
      "A contratação é necessária para atender à demanda apresentada pela Administração.",
    sourceContentHash: "sha256:3b6f7d0b4c2e1a9f",
  },
);

export type SuggestDocumentTextAdjustmentInput = z.output<
  typeof suggestDocumentTextAdjustmentBodySchema
>;
export type ApplyDocumentTextAdjustmentInput = z.output<
  typeof applyDocumentTextAdjustmentBodySchema
>;

export const createDocumentSchema = {
  tags: ["Documents"],
  summary: "Generate document draft",
  body: createDocumentBodySchema,
  response: {
    201: documentDetailSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const getDocumentsSchema = {
  tags: ["Documents"],
  summary: "List documents",
  response: {
    200: z.object({
      items: z.array(documentSummarySchema),
    }),
    ...pickErrorResponses(401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getDocumentSchema = {
  tags: ["Documents"],
  summary: "Get document",
  params: documentParamsSchema,
  response: {
    200: documentDetailSchema,
    ...pickErrorResponses(401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const suggestDocumentTextAdjustmentSchema = {
  tags: ["Documents"],
  summary: "Suggest document text adjustment",
  params: documentParamsSchema,
  body: suggestDocumentTextAdjustmentBodySchema,
  response: {
    200: z.object({
      selectedText: z.string(),
      replacementText: z.string(),
      sourceContentHash: z.string(),
      sourceTarget: documentAdjustmentSourceTargetSchema,
    }),
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;

export const applyDocumentTextAdjustmentSchema = {
  tags: ["Documents"],
  summary: "Apply document text adjustment",
  params: documentParamsSchema,
  body: applyDocumentTextAdjustmentBodySchema,
  response: {
    200: documentDetailSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;
