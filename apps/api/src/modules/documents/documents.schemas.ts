import { type AppRouteSchema, z } from "../../shared/http/zod";

const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  organizationId: z.string().nullable(),
});

export const documentParamsSchema = z.object({
  documentId: z.string(),
});

export const getDocumentsSchema = {
  tags: ["Documents"],
  summary: "List documents",
  response: {
    200: z.object({
      items: z.array(documentSchema),
    }),
  },
} satisfies AppRouteSchema;

export const getDocumentSchema = {
  tags: ["Documents"],
  summary: "Get document",
  params: documentParamsSchema,
  response: {
    200: documentSchema,
  },
} satisfies AppRouteSchema;
