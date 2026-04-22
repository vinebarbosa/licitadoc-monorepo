import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_DATE_TIME,
  OPENAPI_EXAMPLE_PERSON_NAME,
  OPENAPI_EXAMPLE_PROCESS_NUMBER,
  OPENAPI_EXAMPLE_PROCESS_STATUS,
  OPENAPI_EXAMPLE_UUID,
  OPENAPI_EXAMPLE_UUID_LIST,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";

function normalizeNullableOptionalText(value?: string | null) {
  if (value == null) {
    return null;
  }

  const next = value.trim();

  return next ? next : null;
}

function requiredTextSchema(fieldLabel: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${fieldLabel} is required.`,
    });
}

function dateTimeSchema(fieldLabel: string) {
  return requiredTextSchema(fieldLabel)
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `${fieldLabel} must be a valid date.`,
    })
    .transform((value) => new Date(value).toISOString());
}

function processDepartmentIdsSchema(fieldLabel: string) {
  return z
    .array(openApiUuidSchema())
    .transform((values) => Array.from(new Set(values)))
    .refine((values) => values.length > 0, {
      message: `${fieldLabel} must contain at least one department.`,
    });
}

const OPENAPI_EXAMPLE_PROCESS_TYPE = "pregao-eletronico";
const OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID = "PROC-2026-001";
const OPENAPI_EXAMPLE_PROCESS_OBJECT = "Aquisicao de materiais de escritorio";
const OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION = "Reposicao de estoque das unidades administrativas.";
const OPENAPI_EXAMPLE_PROCESS_SOURCE_METADATA = {
  extractedFields: {
    budgetUnitCode: "06.001",
    requestNumber: "6",
  },
  sourceFile: {
    contentType: "application/pdf",
    etag: "abc123",
    fileName: "SD.pdf",
    sizeBytes: 245760,
    storageBucket: "licitadoc-expense-requests",
    storageKey: "expense-requests/2026/04/2026-04-21t12-00-00-000z-sd.pdf",
    uploadedAt: "2026-04-21T12:00:00.000Z",
  },
  warnings: [],
};
const createProcessBodyExample = {
  type: OPENAPI_EXAMPLE_PROCESS_TYPE,
  processNumber: OPENAPI_EXAMPLE_PROCESS_NUMBER,
  externalId: OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID,
  issuedAt: OPENAPI_EXAMPLE_DATE_TIME,
  object: OPENAPI_EXAMPLE_PROCESS_OBJECT,
  justification: OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
  responsibleName: OPENAPI_EXAMPLE_PERSON_NAME,
  status: OPENAPI_EXAMPLE_PROCESS_STATUS,
  organizationId: OPENAPI_EXAMPLE_UUID,
  departmentIds: OPENAPI_EXAMPLE_UUID_LIST,
  sourceKind: "expense_request",
  sourceReference: "SD-6-2026",
  sourceMetadata: OPENAPI_EXAMPLE_PROCESS_SOURCE_METADATA,
};
const updateProcessBodyExample = {
  status: OPENAPI_EXAMPLE_PROCESS_STATUS,
  justification: OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
};
const createProcessFromExpenseRequestBodyExample = {
  expenseRequestText:
    "CNPJ: 08.290.223/0001-42\nUnidade Orcamentaria: 06.001 - Secretaria Municipal de Educacao\nN Solicitacao:\n6\nData Emissao:\n08/01/2026\nProcesso:\nServico\nClassificacao:\nContratacao de apresentacao artistica\nObjeto:\nJustificativa da necessidade.",
  organizationId: OPENAPI_EXAMPLE_UUID,
  departmentIds: OPENAPI_EXAMPLE_UUID_LIST,
  sourceLabel: "SD.pdf",
};
const createProcessFromExpenseRequestPdfBodyExample = {
  departmentIds: OPENAPI_EXAMPLE_UUID_LIST,
  file: "(binary PDF file)",
  organizationId: OPENAPI_EXAMPLE_UUID,
  sourceLabel: "SD.pdf",
};

const processTypeSchema = withOpenApiExample(
  requiredTextSchema("Process type"),
  OPENAPI_EXAMPLE_PROCESS_TYPE,
);
const processNumberSchema = withOpenApiExample(
  requiredTextSchema("Process number"),
  OPENAPI_EXAMPLE_PROCESS_NUMBER,
);
const processExternalIdCreateSchema = withOpenApiExample(
  z.string().nullable().optional().transform(normalizeNullableOptionalText),
  OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID,
);
const processExternalIdUpdateSchema = withOpenApiExample(
  z.string().nullable().transform(normalizeNullableOptionalText).optional(),
  OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID,
);
const processIssuedAtSchema = withOpenApiExample(
  dateTimeSchema("Process issued at"),
  OPENAPI_EXAMPLE_DATE_TIME,
);
const processObjectSchema = withOpenApiExample(
  requiredTextSchema("Process object"),
  OPENAPI_EXAMPLE_PROCESS_OBJECT,
);
const processJustificationSchema = withOpenApiExample(
  requiredTextSchema("Process justification"),
  OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
);
const processResponsibleNameSchema = withOpenApiExample(
  requiredTextSchema("Process responsible name"),
  OPENAPI_EXAMPLE_PERSON_NAME,
);
const processStatusSchema = withOpenApiExample(
  requiredTextSchema("Process status"),
  OPENAPI_EXAMPLE_PROCESS_STATUS,
);
const expenseRequestTextSchema = withOpenApiExample(
  requiredTextSchema("Expense request text"),
  createProcessFromExpenseRequestBodyExample.expenseRequestText,
);
const processSourceKindSchema = withOpenApiExample(
  z.string().nullable().optional().transform(normalizeNullableOptionalText),
  "expense_request",
);
const processSourceReferenceSchema = withOpenApiExample(
  z.string().nullable().optional().transform(normalizeNullableOptionalText),
  "SD-6-2026",
);
const processSourceMetadataSchema = withOpenApiExample(
  z.object({}).catchall(z.unknown()).nullable().optional(),
  OPENAPI_EXAMPLE_PROCESS_SOURCE_METADATA,
);

const processSchema = z.object({
  id: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  type: z.string(),
  processNumber: z.string(),
  externalId: z.string().nullable(),
  issuedAt: z.string(),
  object: z.string(),
  justification: z.string(),
  responsibleName: z.string(),
  status: z.string(),
  sourceKind: z.string().nullable(),
  sourceReference: z.string().nullable(),
  sourceMetadata: z.object({}).catchall(z.unknown()).nullable(),
  departmentIds: z.array(openApiUuidSchema()).meta({
    example: OPENAPI_EXAMPLE_UUID_LIST,
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const processParamsSchema = z.object({
  processId: openApiUuidSchema(),
});

export const processesPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createProcessBodySchema = withOpenApiExample(
  z
    .object({
      type: processTypeSchema,
      processNumber: processNumberSchema,
      externalId: processExternalIdCreateSchema,
      issuedAt: processIssuedAtSchema,
      object: processObjectSchema,
      justification: processJustificationSchema,
      responsibleName: processResponsibleNameSchema,
      status: withOpenApiExample(
        processStatusSchema.optional().default(OPENAPI_EXAMPLE_PROCESS_STATUS),
        OPENAPI_EXAMPLE_PROCESS_STATUS,
      ),
      organizationId: openApiUuidSchema().optional(),
      departmentIds: withOpenApiExample(
        processDepartmentIdsSchema("Process department ids"),
        OPENAPI_EXAMPLE_UUID_LIST,
      ),
      sourceKind: processSourceKindSchema,
      sourceReference: processSourceReferenceSchema,
      sourceMetadata: processSourceMetadataSchema,
    })
    .strict(),
  createProcessBodyExample,
);

export const updateProcessBodySchema = withOpenApiExample(
  z
    .object({
      type: withOpenApiExample(processTypeSchema.optional(), OPENAPI_EXAMPLE_PROCESS_TYPE),
      processNumber: withOpenApiExample(
        processNumberSchema.optional(),
        OPENAPI_EXAMPLE_PROCESS_NUMBER,
      ),
      externalId: processExternalIdUpdateSchema,
      issuedAt: withOpenApiExample(processIssuedAtSchema.optional(), OPENAPI_EXAMPLE_DATE_TIME),
      object: withOpenApiExample(processObjectSchema.optional(), OPENAPI_EXAMPLE_PROCESS_OBJECT),
      justification: withOpenApiExample(
        processJustificationSchema.optional(),
        OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
      ),
      responsibleName: withOpenApiExample(
        processResponsibleNameSchema.optional(),
        OPENAPI_EXAMPLE_PERSON_NAME,
      ),
      status: withOpenApiExample(processStatusSchema.optional(), OPENAPI_EXAMPLE_PROCESS_STATUS),
      departmentIds: withOpenApiExample(
        processDepartmentIdsSchema("Process department ids").optional(),
        OPENAPI_EXAMPLE_UUID_LIST,
      ),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided.",
    }),
  updateProcessBodyExample,
);

export const createProcessFromExpenseRequestBodySchema = withOpenApiExample(
  z
    .object({
      expenseRequestText: expenseRequestTextSchema,
      organizationId: openApiUuidSchema().optional(),
      departmentIds: withOpenApiExample(
        processDepartmentIdsSchema("Process department ids").optional(),
        OPENAPI_EXAMPLE_UUID_LIST,
      ),
      sourceLabel: withOpenApiExample(
        z.string().nullable().optional().transform(normalizeNullableOptionalText),
        "SD.pdf",
      ),
      fileName: withOpenApiExample(
        z.string().nullable().optional().transform(normalizeNullableOptionalText),
        "SD.pdf",
      ),
    })
    .strict(),
  createProcessFromExpenseRequestBodyExample,
);

const createProcessFromExpenseRequestPdfBodySchema = withOpenApiExample(
  z
    .object({
      file: z.any().meta({
        description: "Expense request PDF file",
        format: "binary",
        isFile: true,
      }),
      organizationId: withOpenApiExample(z.any().optional(), OPENAPI_EXAMPLE_UUID),
      departmentIds: withOpenApiExample(z.any().optional(), OPENAPI_EXAMPLE_UUID_LIST),
      sourceLabel: withOpenApiExample(z.any().optional(), "SD.pdf"),
    })
    .strict(),
  createProcessFromExpenseRequestPdfBodyExample,
);

const paginatedProcessesSchema = z.object({
  items: z.array(processSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const createProcessSchema = {
  tags: ["Processes"],
  summary: "Create process",
  body: createProcessBodySchema,
  response: {
    201: processSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;

export const createProcessFromExpenseRequestSchema = {
  tags: ["Processes"],
  summary: "Create process from expense request",
  body: createProcessFromExpenseRequestBodySchema,
  response: {
    201: processSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;

export const createProcessFromExpenseRequestPdfSchema = {
  tags: ["Processes"],
  summary: "Create process from expense request PDF",
  consumes: ["multipart/form-data"],
  body: createProcessFromExpenseRequestPdfBodySchema,
  response: {
    201: processSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;

export type CreateProcessInput = z.output<typeof createProcessBodySchema>;
export type CreateProcessFromExpenseRequestInput = z.output<
  typeof createProcessFromExpenseRequestBodySchema
>;
export type UpdateProcessInput = z.output<typeof updateProcessBodySchema>;

export const getProcessesSchema = {
  tags: ["Processes"],
  summary: "List processes",
  querystring: processesPaginationQuerySchema,
  response: {
    200: paginatedProcessesSchema,
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getProcessSchema = {
  tags: ["Processes"],
  summary: "Get process",
  params: processParamsSchema,
  response: {
    200: processSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const updateProcessSchema = {
  tags: ["Processes"],
  summary: "Update process",
  params: processParamsSchema,
  body: updateProcessBodySchema,
  response: {
    200: processSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;
