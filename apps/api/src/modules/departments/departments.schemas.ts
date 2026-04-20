import { type AppRouteSchema, z } from "../../shared/http/zod";

function requiredTextSchema(fieldLabel: string) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: `${fieldLabel} is required.`,
    });
}

const departmentNameSchema = requiredTextSchema("Department name");
const departmentSlugSchema = requiredTextSchema("Department slug")
  .transform((value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  )
  .refine((value) => value.length > 0, {
    message: "Department slug is invalid.",
  });
const departmentResponsibleNameSchema = requiredTextSchema("Department responsible name");
const departmentResponsibleRoleSchema = requiredTextSchema("Department responsible role");

const departmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  organizationId: z.string().uuid(),
  responsibleName: z.string(),
  responsibleRole: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const departmentParamsSchema = z.object({
  departmentId: z.string().uuid(),
});

export const departmentsPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createDepartmentBodySchema = z
  .object({
    name: departmentNameSchema,
    slug: departmentSlugSchema,
    organizationId: z.string().uuid().optional(),
    responsibleName: departmentResponsibleNameSchema,
    responsibleRole: departmentResponsibleRoleSchema,
  })
  .strict();

export const updateDepartmentBodySchema = z
  .object({
    name: departmentNameSchema.optional(),
    slug: departmentSlugSchema.optional(),
    responsibleName: departmentResponsibleNameSchema.optional(),
    responsibleRole: departmentResponsibleRoleSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

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
  },
} satisfies AppRouteSchema;

export const getDepartmentSchema = {
  tags: ["Departments"],
  summary: "Get department",
  params: departmentParamsSchema,
  response: {
    200: departmentSchema,
  },
} satisfies AppRouteSchema;

export const updateDepartmentSchema = {
  tags: ["Departments"],
  summary: "Update department",
  params: departmentParamsSchema,
  body: updateDepartmentBodySchema,
  response: {
    200: departmentSchema,
  },
} satisfies AppRouteSchema;
