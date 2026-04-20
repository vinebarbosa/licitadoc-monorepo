import { type AppRouteSchema, z } from "../../shared/http/zod";

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
    .array(z.string().uuid())
    .transform((values) => Array.from(new Set(values)))
    .refine((values) => values.length > 0, {
      message: `${fieldLabel} must contain at least one department.`,
    });
}

const processTypeSchema = requiredTextSchema("Process type");
const processNumberSchema = requiredTextSchema("Process number");
const processExternalIdCreateSchema = z
  .string()
  .nullable()
  .optional()
  .transform(normalizeNullableOptionalText);
const processExternalIdUpdateSchema = z
  .string()
  .nullable()
  .transform(normalizeNullableOptionalText)
  .optional();
const processIssuedAtSchema = dateTimeSchema("Process issued at");
const processObjectSchema = requiredTextSchema("Process object");
const processJustificationSchema = requiredTextSchema("Process justification");
const processResponsibleNameSchema = requiredTextSchema("Process responsible name");
const processStatusSchema = requiredTextSchema("Process status");

const processSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  type: z.string(),
  processNumber: z.string(),
  externalId: z.string().nullable(),
  issuedAt: z.string(),
  object: z.string(),
  justification: z.string(),
  responsibleName: z.string(),
  status: z.string(),
  departmentIds: z.array(z.string().uuid()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const processParamsSchema = z.object({
  processId: z.string().uuid(),
});

export const processesPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createProcessBodySchema = z
  .object({
    type: processTypeSchema,
    processNumber: processNumberSchema,
    externalId: processExternalIdCreateSchema,
    issuedAt: processIssuedAtSchema,
    object: processObjectSchema,
    justification: processJustificationSchema,
    responsibleName: processResponsibleNameSchema,
    status: processStatusSchema.optional().default("draft"),
    organizationId: z.string().uuid().optional(),
    departmentIds: processDepartmentIdsSchema("Process department ids"),
  })
  .strict();

export const updateProcessBodySchema = z
  .object({
    type: processTypeSchema.optional(),
    processNumber: processNumberSchema.optional(),
    externalId: processExternalIdUpdateSchema,
    issuedAt: processIssuedAtSchema.optional(),
    object: processObjectSchema.optional(),
    justification: processJustificationSchema.optional(),
    responsibleName: processResponsibleNameSchema.optional(),
    status: processStatusSchema.optional(),
    departmentIds: processDepartmentIdsSchema("Process department ids").optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

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
  },
} satisfies AppRouteSchema;

export type CreateProcessInput = z.output<typeof createProcessBodySchema>;
export type UpdateProcessInput = z.output<typeof updateProcessBodySchema>;

export const getProcessesSchema = {
  tags: ["Processes"],
  summary: "List processes",
  querystring: processesPaginationQuerySchema,
  response: {
    200: paginatedProcessesSchema,
  },
} satisfies AppRouteSchema;

export const getProcessSchema = {
  tags: ["Processes"],
  summary: "Get process",
  params: processParamsSchema,
  response: {
    200: processSchema,
  },
} satisfies AppRouteSchema;

export const updateProcessSchema = {
  tags: ["Processes"],
  summary: "Update process",
  params: processParamsSchema,
  body: updateProcessBodySchema,
  response: {
    200: processSchema,
  },
} satisfies AppRouteSchema;
