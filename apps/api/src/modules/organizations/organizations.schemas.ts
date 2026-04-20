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

function digitCountSchema(fieldLabel: string, digitsCount: number) {
  return requiredTextSchema(fieldLabel).refine(
    (value) => value.replace(/\D/g, "").length === digitsCount,
    {
      message: `${fieldLabel} must contain ${digitsCount} digits.`,
    },
  );
}

const organizationNameSchema = requiredTextSchema("Organization name");
const organizationSlugSchema = requiredTextSchema("Organization slug")
  .transform((value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  )
  .refine((value) => value.length > 0, {
    message: "Organization slug is invalid.",
  });
const organizationOfficialNameSchema = z
  .string()
  .transform((value) => requiredTextSchema("Organization official name").parse(value));
const organizationCnpjSchema = digitCountSchema("Organization CNPJ", 14);
const organizationCitySchema = requiredTextSchema("Organization city");
const organizationStateSchema = requiredTextSchema("Organization state")
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z]{2}$/.test(value), {
    message: "Organization state must be a valid UF.",
  });
const organizationAddressSchema = z
  .string()
  .transform((value) => requiredTextSchema("Organization address").parse(value));
const organizationZipCodeSchema = digitCountSchema("Organization zip code", 8);
const organizationPhoneSchema = requiredTextSchema("Organization phone");
const organizationInstitutionalEmailSchema = requiredTextSchema("Organization institutional email")
  .refine((value) => z.email().safeParse(value).success, {
    message: "Organization institutional email must be a valid email.",
  })
  .transform((value) => value.toLowerCase());
const organizationWebsiteSchema = z
  .string()
  .nullable()
  .optional()
  .transform(normalizeNullableOptionalText);
const organizationLogoUrlSchema = z
  .string()
  .nullable()
  .optional()
  .transform(normalizeNullableOptionalText);
const organizationWebsiteUpdateSchema = z
  .string()
  .nullable()
  .transform(normalizeNullableOptionalText)
  .optional();
const organizationLogoUrlUpdateSchema = z
  .string()
  .nullable()
  .transform(normalizeNullableOptionalText)
  .optional();
const organizationAuthorityNameSchema = z
  .string()
  .transform((value) => requiredTextSchema("Organization authority name").parse(value));
const organizationAuthorityRoleSchema = z
  .string()
  .transform((value) => requiredTextSchema("Organization authority role").parse(value));

const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  officialName: z.string(),
  cnpj: z.string(),
  city: z.string(),
  state: z.string(),
  address: z.string(),
  zipCode: z.string(),
  phone: z.string(),
  institutionalEmail: z.email(),
  website: z.string().nullable(),
  logoUrl: z.string().nullable(),
  authorityName: z.string(),
  authorityRole: z.string(),
  isActive: z.boolean(),
  createdByUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const organizationParamsSchema = z.object({
  organizationId: z.string().uuid(),
});

export const organizationsPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createOrganizationBodySchema = z
  .object({
    name: organizationNameSchema,
    slug: organizationSlugSchema,
    officialName: organizationOfficialNameSchema,
    cnpj: organizationCnpjSchema,
    city: organizationCitySchema,
    state: organizationStateSchema,
    address: organizationAddressSchema,
    zipCode: organizationZipCodeSchema,
    phone: organizationPhoneSchema,
    institutionalEmail: organizationInstitutionalEmailSchema,
    website: organizationWebsiteSchema,
    logoUrl: organizationLogoUrlSchema,
    authorityName: organizationAuthorityNameSchema,
    authorityRole: organizationAuthorityRoleSchema,
  })
  .strict();

export const updateOrganizationBodySchema = z
  .object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
    officialName: organizationOfficialNameSchema.optional(),
    cnpj: organizationCnpjSchema.optional(),
    city: organizationCitySchema.optional(),
    state: organizationStateSchema.optional(),
    address: organizationAddressSchema.optional(),
    zipCode: organizationZipCodeSchema.optional(),
    phone: organizationPhoneSchema.optional(),
    institutionalEmail: organizationInstitutionalEmailSchema.optional(),
    website: organizationWebsiteUpdateSchema,
    logoUrl: organizationLogoUrlUpdateSchema,
    authorityName: organizationAuthorityNameSchema.optional(),
    authorityRole: organizationAuthorityRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

const paginatedOrganizationsSchema = z.object({
  items: z.array(organizationSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const createOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Create organization during onboarding",
  body: createOrganizationBodySchema,
  response: {
    201: organizationSchema,
  },
} satisfies AppRouteSchema;

export type CreateOrganizationInput = z.output<typeof createOrganizationBodySchema>;
export type UpdateOrganizationInput = z.output<typeof updateOrganizationBodySchema>;

export const getOrganizationsSchema = {
  tags: ["Organizations"],
  summary: "List organizations",
  querystring: organizationsPaginationQuerySchema,
  response: {
    200: paginatedOrganizationsSchema,
  },
} satisfies AppRouteSchema;

export const getOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Get organization",
  params: organizationParamsSchema,
  response: {
    200: organizationSchema,
  },
} satisfies AppRouteSchema;

export const updateOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Update organization",
  params: organizationParamsSchema,
  body: updateOrganizationBodySchema,
  response: {
    200: organizationSchema,
  },
} satisfies AppRouteSchema;
