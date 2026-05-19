import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_NAME,
  OPENAPI_EXAMPLE_PERSON_NAME,
  OPENAPI_EXAMPLE_ROLE_NAME,
  OPENAPI_EXAMPLE_SLUG,
  OPENAPI_EXAMPLE_UUID,
  openApiUuidSchema,
  withOpenApiExample,
  z,
} from "../../shared/http/zod";

function requiredTextSchema(fieldLabel: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${fieldLabel} is required.`,
    });
}

function normalizeNullableOptionalText(value?: string | null) {
  if (value == null) {
    return null;
  }

  const next = value.trim();

  return next ? next : null;
}

const createDepartmentBodyExample = {
  name: OPENAPI_EXAMPLE_NAME,
  slug: OPENAPI_EXAMPLE_SLUG,
  budgetUnitCode: "06.001",
  organizationId: OPENAPI_EXAMPLE_UUID,
  responsibleName: OPENAPI_EXAMPLE_PERSON_NAME,
  responsibleRole: OPENAPI_EXAMPLE_ROLE_NAME,
};
const updateDepartmentBodyExample = {
  name: OPENAPI_EXAMPLE_NAME,
  budgetUnitCode: "06.002",
  responsibleRole: OPENAPI_EXAMPLE_ROLE_NAME,
};

const departmentNameSchema = withOpenApiExample(
  requiredTextSchema("Department name"),
  OPENAPI_EXAMPLE_NAME,
);
const departmentSlugSchema = withOpenApiExample(
  requiredTextSchema("Department slug")
    .transform((value) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .refine((value) => value.length > 0, {
      message: "Department slug is invalid.",
    }),
  OPENAPI_EXAMPLE_SLUG,
);
const departmentResponsibleNameSchema = withOpenApiExample(
  requiredTextSchema("Department responsible name"),
  OPENAPI_EXAMPLE_PERSON_NAME,
);
const departmentResponsibleRoleSchema = withOpenApiExample(
  requiredTextSchema("Department responsible role"),
  OPENAPI_EXAMPLE_ROLE_NAME,
);
const departmentBudgetUnitCodeSchema = withOpenApiExample(
  z.string().nullable().optional().transform(normalizeNullableOptionalText),
  "06.001",
);
const departmentBudgetUnitCodeUpdateSchema = withOpenApiExample(
  z.string().nullable().transform(normalizeNullableOptionalText).optional(),
  "06.001",
);

const departmentSchema = z.object({
  id: openApiUuidSchema(),
  name: z.string(),
  slug: z.string(),
  organizationId: openApiUuidSchema(),
  budgetUnitCode: z.string().nullable(),
  responsibleName: z.string(),
  responsibleRole: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const departmentParamsSchema = z.object({
  departmentId: openApiUuidSchema(),
});

export const departmentsPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createDepartmentBodySchema = withOpenApiExample(
  z
    .object({
      name: departmentNameSchema,
      slug: departmentSlugSchema,
      budgetUnitCode: departmentBudgetUnitCodeSchema,
      organizationId: openApiUuidSchema().optional(),
      responsibleName: departmentResponsibleNameSchema,
      responsibleRole: departmentResponsibleRoleSchema,
    })
    .strict(),
  createDepartmentBodyExample,
);

export const updateDepartmentBodySchema = withOpenApiExample(
  z
    .object({
      name: withOpenApiExample(departmentNameSchema.optional(), OPENAPI_EXAMPLE_NAME),
      slug: withOpenApiExample(departmentSlugSchema.optional(), OPENAPI_EXAMPLE_SLUG),
      budgetUnitCode: departmentBudgetUnitCodeUpdateSchema,
      responsibleName: withOpenApiExample(
        departmentResponsibleNameSchema.optional(),
        OPENAPI_EXAMPLE_PERSON_NAME,
      ),
      responsibleRole: withOpenApiExample(
        departmentResponsibleRoleSchema.optional(),
        OPENAPI_EXAMPLE_ROLE_NAME,
      ),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided.",
    }),
  updateDepartmentBodyExample,
);

const paginatedDepartmentsSchema = z.object({
  items: z.array(departmentSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const createDepartmentSchema = {
  tags: ["Departments"],
  summary: "Create department",
  body: createDepartmentBodySchema,
  response: {
    201: departmentSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;

export type CreateDepartmentInput = z.output<typeof createDepartmentBodySchema>;
export type UpdateDepartmentInput = z.output<typeof updateDepartmentBodySchema>;

export const getDepartmentsSchema = {
  tags: ["Departments"],
  summary: "List departments",
  querystring: departmentsPaginationQuerySchema,
  response: {
    200: paginatedDepartmentsSchema,
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getDepartmentSchema = {
  tags: ["Departments"],
  summary: "Get department",
  params: departmentParamsSchema,
  response: {
    200: departmentSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const updateDepartmentSchema = {
  tags: ["Departments"],
  summary: "Update department",
  params: departmentParamsSchema,
  body: updateDepartmentBodySchema,
  response: {
    200: departmentSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;
