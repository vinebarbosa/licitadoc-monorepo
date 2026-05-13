import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_DATE_TIME,
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

const OPENAPI_EXAMPLE_PROCUREMENT_METHOD = "bidding";
const OPENAPI_EXAMPLE_BIDDING_MODALITY = "reverse_auction";
const OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID = "PROC-2026-001";
const OPENAPI_EXAMPLE_PROCESS_TITLE = "Materiais de escritorio";
const OPENAPI_EXAMPLE_PROCESS_OBJECT = "Aquisicao de materiais de escritorio";
const OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION = "Reposicao de estoque das unidades administrativas.";
const OPENAPI_EXAMPLE_PROCESS_RESPONSIBLE_NAME = "Maria Silva";
const OPENAPI_EXAMPLE_PROCESS_ITEMS = [
  {
    kind: "kit",
    code: "1",
    title: "Kit escolar",
    quantity: "100",
    unit: "kit",
    unitValue: "120.00",
    totalValue: "12000.00",
    components: [
      {
        title: "Caderno",
        description: "Caderno brochura capa dura",
        quantity: "2",
        unit: "unidade",
      },
    ],
  },
  {
    kind: "simple",
    code: "2",
    title: "Caneta azul",
    description: "Caneta esferografica azul",
    quantity: "500",
    unit: "unidade",
    unitValue: "1.50",
    totalValue: "750.00",
  },
];
const OPENAPI_EXAMPLE_PROCESS_SUMMARY = {
  itemCount: 2,
  componentCount: 1,
  estimatedTotalValue: "12750.00",
};
const createProcessBodyExample = {
  procurementMethod: OPENAPI_EXAMPLE_PROCUREMENT_METHOD,
  biddingModality: OPENAPI_EXAMPLE_BIDDING_MODALITY,
  processNumber: OPENAPI_EXAMPLE_PROCESS_NUMBER,
  externalId: OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID,
  issuedAt: OPENAPI_EXAMPLE_DATE_TIME,
  title: OPENAPI_EXAMPLE_PROCESS_TITLE,
  object: OPENAPI_EXAMPLE_PROCESS_OBJECT,
  justification: OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
  responsibleName: OPENAPI_EXAMPLE_PROCESS_RESPONSIBLE_NAME,
  status: OPENAPI_EXAMPLE_PROCESS_STATUS,
  organizationId: OPENAPI_EXAMPLE_UUID,
  departmentIds: OPENAPI_EXAMPLE_UUID_LIST,
  items: OPENAPI_EXAMPLE_PROCESS_ITEMS,
};
const updateProcessBodyExample = {
  status: OPENAPI_EXAMPLE_PROCESS_STATUS,
  justification: OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
  responsibleName: OPENAPI_EXAMPLE_PROCESS_RESPONSIBLE_NAME,
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

const nullableTextCreateSchema = z
  .string()
  .nullable()
  .optional()
  .transform(normalizeNullableOptionalText);
const nullableTextUpdateSchema = z
  .string()
  .nullable()
  .transform(normalizeNullableOptionalText)
  .optional();
const decimalTextSchema = z.union([z.string(), z.number()]).transform((value) => {
  if (typeof value === "number") {
    return String(value);
  }

  return value.trim();
});
const optionalDecimalTextSchema = decimalTextSchema
  .nullable()
  .optional()
  .transform((value) => {
    if (value == null || value === "") {
      return null;
    }

    return value;
  });

const processNumberSchema = withOpenApiExample(
  requiredTextSchema("Process number"),
  OPENAPI_EXAMPLE_PROCESS_NUMBER,
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
  OPENAPI_EXAMPLE_PROCESS_RESPONSIBLE_NAME,
);
const processStatusSchema = withOpenApiExample(
  requiredTextSchema("Process status"),
  OPENAPI_EXAMPLE_PROCESS_STATUS,
);
const expenseRequestTextSchema = withOpenApiExample(
  requiredTextSchema("Expense request text"),
  createProcessFromExpenseRequestBodyExample.expenseRequestText,
);

const processItemComponentInputSchema = z.object({
  title: requiredTextSchema("Process item component title"),
  description: nullableTextCreateSchema,
  quantity: optionalDecimalTextSchema,
  unit: requiredTextSchema("Process item component unit"),
});
const simpleProcessItemInputSchema = z.object({
  kind: z.literal("simple"),
  code: requiredTextSchema("Process item code"),
  title: requiredTextSchema("Process item title"),
  description: nullableTextCreateSchema,
  quantity: optionalDecimalTextSchema,
  unit: requiredTextSchema("Process item unit"),
  unitValue: optionalDecimalTextSchema,
  totalValue: optionalDecimalTextSchema,
});
const kitProcessItemInputSchema = z.object({
  kind: z.literal("kit"),
  code: requiredTextSchema("Process item code"),
  title: requiredTextSchema("Process item title"),
  quantity: optionalDecimalTextSchema,
  unit: requiredTextSchema("Process item unit"),
  unitValue: optionalDecimalTextSchema,
  totalValue: optionalDecimalTextSchema,
  components: z.array(processItemComponentInputSchema).default([]),
});
const processItemInputSchema = z.discriminatedUnion("kind", [
  simpleProcessItemInputSchema,
  kitProcessItemInputSchema,
]);
const processItemComponentSchema = z.object({
  id: openApiUuidSchema(),
  title: z.string(),
  description: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string(),
});
const simpleProcessItemSchema = z.object({
  id: openApiUuidSchema(),
  kind: z.literal("simple"),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string(),
  unitValue: z.string().nullable(),
  totalValue: z.string().nullable(),
});
const kitProcessItemSchema = z.object({
  id: openApiUuidSchema(),
  kind: z.literal("kit"),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string(),
  unitValue: z.string().nullable(),
  totalValue: z.string().nullable(),
  components: z.array(processItemComponentSchema),
});
const processItemSchema = z.discriminatedUnion("kind", [
  simpleProcessItemSchema,
  kitProcessItemSchema,
]);
const processSummarySchema = z.object({
  itemCount: z.number().int().nonnegative(),
  componentCount: z.number().int().nonnegative(),
  estimatedTotalValue: z.string().nullable(),
});

const processSchema = z.object({
  id: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  procurementMethod: z.string().nullable(),
  biddingModality: z.string().nullable(),
  processNumber: z.string(),
  externalId: z.string().nullable(),
  issuedAt: z.string(),
  title: z.string(),
  object: z.string(),
  justification: z.string(),
  responsibleName: z.string(),
  status: z.string(),
  departmentIds: z.array(openApiUuidSchema()).meta({
    example: OPENAPI_EXAMPLE_UUID_LIST,
  }),
  items: z.array(processItemSchema),
  summary: processSummarySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const expectedProcessDocumentTypeSchema = z.enum(["dfd", "etp", "tr", "minuta"]);

const processDocumentProgressSchema = z.object({
  completedCount: z.number().int().nonnegative(),
  totalRequiredCount: z.number().int().nonnegative(),
  completedTypes: z.array(expectedProcessDocumentTypeSchema),
  missingTypes: z.array(expectedProcessDocumentTypeSchema),
});

const processListItemSchema = processSchema.extend({
  documents: processDocumentProgressSchema,
  listUpdatedAt: z.string(),
});

const processDetailDepartmentSchema = z.object({
  id: openApiUuidSchema(),
  organizationId: openApiUuidSchema(),
  name: z.string(),
  budgetUnitCode: z.string().nullable(),
  label: z.string(),
});

const processDetailDocumentStatusSchema = z.enum(["concluido", "em_edicao", "pendente", "erro"]);

const processDetailDocumentActionsSchema = z.object({
  create: z.boolean(),
  edit: z.boolean(),
  view: z.boolean(),
});

const processDetailDocumentCardSchema = z.object({
  type: expectedProcessDocumentTypeSchema,
  label: z.string(),
  title: z.string(),
  description: z.string(),
  status: processDetailDocumentStatusSchema,
  documentId: openApiUuidSchema().nullable(),
  lastUpdatedAt: z.string().nullable(),
  progress: z.number().int().min(0).max(100).nullable(),
  availableActions: processDetailDocumentActionsSchema,
});

const processDetailExample = {
  ...createProcessBodyExample,
  id: OPENAPI_EXAMPLE_UUID,
  organizationId: OPENAPI_EXAMPLE_UUID,
  title: OPENAPI_EXAMPLE_PROCESS_TITLE,
  summary: OPENAPI_EXAMPLE_PROCESS_SUMMARY,
  createdAt: OPENAPI_EXAMPLE_DATE_TIME,
  updatedAt: OPENAPI_EXAMPLE_DATE_TIME,
  departments: [
    {
      id: OPENAPI_EXAMPLE_UUID,
      organizationId: OPENAPI_EXAMPLE_UUID,
      name: "Secretaria Municipal de Educacao",
      budgetUnitCode: "06.001",
      label: "06.001 - Secretaria Municipal de Educacao",
    },
  ],
  documents: [
    {
      type: "dfd",
      label: "DFD",
      title: "Documento de Formalização de Demanda",
      description: "Justificativa da necessidade de contratação",
      status: "concluido",
      documentId: OPENAPI_EXAMPLE_UUID,
      lastUpdatedAt: OPENAPI_EXAMPLE_DATE_TIME,
      progress: null,
      availableActions: {
        create: false,
        edit: true,
        view: true,
      },
    },
  ],
  detailUpdatedAt: OPENAPI_EXAMPLE_DATE_TIME,
};

const processDetailSchema = withOpenApiExample(
  processSchema.extend({
    departments: z.array(processDetailDepartmentSchema),
    documents: z.array(processDetailDocumentCardSchema),
    detailUpdatedAt: z.string(),
  }),
  processDetailExample,
);

export const processParamsSchema = z.object({
  processId: openApiUuidSchema(),
});

export const processesPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional().transform(normalizeNullableOptionalText),
  status: z.string().optional().transform(normalizeNullableOptionalText),
  procurementMethod: z.string().optional().transform(normalizeNullableOptionalText),
  biddingModality: z.string().optional().transform(normalizeNullableOptionalText),
});

export const createProcessBodySchema = withOpenApiExample(
  z
    .object({
      procurementMethod: withOpenApiExample(
        nullableTextCreateSchema,
        OPENAPI_EXAMPLE_PROCUREMENT_METHOD,
      ),
      biddingModality: withOpenApiExample(
        nullableTextCreateSchema,
        OPENAPI_EXAMPLE_BIDDING_MODALITY,
      ),
      processNumber: processNumberSchema,
      externalId: withOpenApiExample(nullableTextCreateSchema, OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID),
      issuedAt: processIssuedAtSchema,
      title: withOpenApiExample(nullableTextCreateSchema, OPENAPI_EXAMPLE_PROCESS_TITLE),
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
      items: withOpenApiExample(
        z.array(processItemInputSchema).optional().default([]),
        OPENAPI_EXAMPLE_PROCESS_ITEMS,
      ),
    })
    .strict(),
  createProcessBodyExample,
);

export const updateProcessBodySchema = withOpenApiExample(
  z
    .object({
      procurementMethod: withOpenApiExample(
        nullableTextUpdateSchema,
        OPENAPI_EXAMPLE_PROCUREMENT_METHOD,
      ),
      biddingModality: withOpenApiExample(
        nullableTextUpdateSchema,
        OPENAPI_EXAMPLE_BIDDING_MODALITY,
      ),
      processNumber: withOpenApiExample(
        processNumberSchema.optional(),
        OPENAPI_EXAMPLE_PROCESS_NUMBER,
      ),
      externalId: withOpenApiExample(nullableTextUpdateSchema, OPENAPI_EXAMPLE_PROCESS_EXTERNAL_ID),
      issuedAt: withOpenApiExample(processIssuedAtSchema.optional(), OPENAPI_EXAMPLE_DATE_TIME),
      title: withOpenApiExample(nullableTextUpdateSchema, OPENAPI_EXAMPLE_PROCESS_TITLE),
      object: withOpenApiExample(processObjectSchema.optional(), OPENAPI_EXAMPLE_PROCESS_OBJECT),
      justification: withOpenApiExample(
        processJustificationSchema.optional(),
        OPENAPI_EXAMPLE_PROCESS_JUSTIFICATION,
      ),
      responsibleName: withOpenApiExample(
        processResponsibleNameSchema.optional(),
        OPENAPI_EXAMPLE_PROCESS_RESPONSIBLE_NAME,
      ),
      status: withOpenApiExample(processStatusSchema.optional(), OPENAPI_EXAMPLE_PROCESS_STATUS),
      departmentIds: withOpenApiExample(
        processDepartmentIdsSchema("Process department ids").optional(),
        OPENAPI_EXAMPLE_UUID_LIST,
      ),
      items: withOpenApiExample(
        z.array(processItemInputSchema).optional(),
        OPENAPI_EXAMPLE_PROCESS_ITEMS,
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
  items: z.array(processListItemSchema),
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
    200: processDetailSchema,
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
