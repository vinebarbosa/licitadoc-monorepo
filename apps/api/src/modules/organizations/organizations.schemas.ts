import { pickErrorResponses } from "../../shared/http/errors";
import {
  type AppRouteSchema,
  OPENAPI_EXAMPLE_CITY,
  OPENAPI_EXAMPLE_CNPJ,
  OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL,
  OPENAPI_EXAMPLE_PERSON_NAME,
  OPENAPI_EXAMPLE_PHONE,
  OPENAPI_EXAMPLE_ROLE_NAME,
  OPENAPI_EXAMPLE_STATE,
  OPENAPI_EXAMPLE_URL,
  OPENAPI_EXAMPLE_ZIP_CODE,
  openApiEmailSchema,
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

function digitCountSchema(fieldLabel: string, digitsCount: number) {
  return requiredTextSchema(fieldLabel).refine(
    (value) => value.replace(/\D/g, "").length === digitsCount,
    {
      message: `${fieldLabel} must contain ${digitsCount} digits.`,
    },
  );
}

const OPENAPI_EXAMPLE_ORGANIZATION_NAME = "Prefeitura de Fortaleza";
const OPENAPI_EXAMPLE_ORGANIZATION_OFFICIAL_NAME = "Municipio de Fortaleza";
const OPENAPI_EXAMPLE_ORGANIZATION_ADDRESS = "Rua Exemplo, 123, Centro";
const OPENAPI_EXAMPLE_ORGANIZATION_LOGO_URL = `${OPENAPI_EXAMPLE_URL}/logo.png`;
const OPENAPI_EXAMPLE_ORGANIZATION_SLUG = "prefeitura-de-fortaleza";
const createOrganizationBodyExample = {
  name: OPENAPI_EXAMPLE_ORGANIZATION_NAME,
  slug: OPENAPI_EXAMPLE_ORGANIZATION_SLUG,
  officialName: OPENAPI_EXAMPLE_ORGANIZATION_OFFICIAL_NAME,
  cnpj: OPENAPI_EXAMPLE_CNPJ,
  city: OPENAPI_EXAMPLE_CITY,
  state: OPENAPI_EXAMPLE_STATE,
  address: OPENAPI_EXAMPLE_ORGANIZATION_ADDRESS,
  zipCode: OPENAPI_EXAMPLE_ZIP_CODE,
  phone: OPENAPI_EXAMPLE_PHONE,
  institutionalEmail: OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL,
  website: OPENAPI_EXAMPLE_URL,
  logoUrl: OPENAPI_EXAMPLE_ORGANIZATION_LOGO_URL,
  authorityName: OPENAPI_EXAMPLE_PERSON_NAME,
  authorityRole: OPENAPI_EXAMPLE_ROLE_NAME,
};
const updateOrganizationBodyExample = {
  name: OPENAPI_EXAMPLE_ORGANIZATION_NAME,
  city: OPENAPI_EXAMPLE_CITY,
  website: OPENAPI_EXAMPLE_URL,
  institutionalEmail: OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL,
  isActive: true,
};

const organizationNameSchema = withOpenApiExample(
  requiredTextSchema("Organization name"),
  OPENAPI_EXAMPLE_ORGANIZATION_NAME,
);
const organizationSlugSchema = withOpenApiExample(
  requiredTextSchema("Organization slug")
    .transform((value) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .refine((value) => value.length > 0, {
      message: "Organization slug is invalid.",
    }),
  OPENAPI_EXAMPLE_ORGANIZATION_SLUG,
);
const organizationOfficialNameSchema = withOpenApiExample(
  z.string().transform((value) => requiredTextSchema("Organization official name").parse(value)),
  OPENAPI_EXAMPLE_ORGANIZATION_OFFICIAL_NAME,
);
const organizationCnpjSchema = withOpenApiExample(
  digitCountSchema("Organization CNPJ", 14),
  OPENAPI_EXAMPLE_CNPJ,
);
const organizationCitySchema = withOpenApiExample(
  requiredTextSchema("Organization city"),
  OPENAPI_EXAMPLE_CITY,
);
const organizationStateSchema = withOpenApiExample(
  requiredTextSchema("Organization state")
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value), {
      message: "Organization state must be a valid UF.",
    }),
  OPENAPI_EXAMPLE_STATE,
);
const organizationAddressSchema = withOpenApiExample(
  z.string().transform((value) => requiredTextSchema("Organization address").parse(value)),
  OPENAPI_EXAMPLE_ORGANIZATION_ADDRESS,
);
const organizationZipCodeSchema = withOpenApiExample(
  digitCountSchema("Organization zip code", 8),
  OPENAPI_EXAMPLE_ZIP_CODE,
);
const organizationPhoneSchema = withOpenApiExample(
  requiredTextSchema("Organization phone"),
  OPENAPI_EXAMPLE_PHONE,
);
const organizationInstitutionalEmailSchema = requiredTextSchema("Organization institutional email")
  .refine((value) => openApiEmailSchema().safeParse(value).success, {
    message: "Organization institutional email must be a valid email.",
  })
  .transform((value) => value.toLowerCase())
  .meta({
    format: "email",
    example: OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL,
  });
const organizationWebsiteSchema = withOpenApiExample(
  z.string().nullable().optional().transform(normalizeNullableOptionalText),
  OPENAPI_EXAMPLE_URL,
);
const organizationLogoUrlSchema = withOpenApiExample(
  z.string().nullable().optional().transform(normalizeNullableOptionalText),
  OPENAPI_EXAMPLE_ORGANIZATION_LOGO_URL,
);
const organizationWebsiteUpdateSchema = withOpenApiExample(
  z.string().nullable().transform(normalizeNullableOptionalText).optional(),
  OPENAPI_EXAMPLE_URL,
);
const organizationLogoUrlUpdateSchema = withOpenApiExample(
  z.string().nullable().transform(normalizeNullableOptionalText).optional(),
  OPENAPI_EXAMPLE_ORGANIZATION_LOGO_URL,
);
const organizationAuthorityNameSchema = withOpenApiExample(
  z.string().transform((value) => requiredTextSchema("Organization authority name").parse(value)),
  OPENAPI_EXAMPLE_PERSON_NAME,
);
const organizationAuthorityRoleSchema = withOpenApiExample(
  z.string().transform((value) => requiredTextSchema("Organization authority role").parse(value)),
  OPENAPI_EXAMPLE_ROLE_NAME,
);

const organizationSchema = z.object({
  id: openApiUuidSchema(),
  name: z.string(),
  slug: z.string(),
  officialName: z.string(),
  cnpj: z.string(),
  city: z.string(),
  state: z.string(),
  address: z.string(),
  zipCode: z.string(),
  phone: z.string(),
  institutionalEmail: openApiEmailSchema(OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL),
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
  organizationId: openApiUuidSchema(),
});

export const organizationsPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const createOrganizationBodySchema = withOpenApiExample(
  z
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
    .strict(),
  createOrganizationBodyExample,
);

export const updateOrganizationBodySchema = withOpenApiExample(
  z
    .object({
      name: withOpenApiExample(
        organizationNameSchema.optional(),
        OPENAPI_EXAMPLE_ORGANIZATION_NAME,
      ),
      slug: withOpenApiExample(
        organizationSlugSchema.optional(),
        OPENAPI_EXAMPLE_ORGANIZATION_SLUG,
      ),
      officialName: withOpenApiExample(
        organizationOfficialNameSchema.optional(),
        OPENAPI_EXAMPLE_ORGANIZATION_OFFICIAL_NAME,
      ),
      cnpj: withOpenApiExample(organizationCnpjSchema.optional(), OPENAPI_EXAMPLE_CNPJ),
      city: withOpenApiExample(organizationCitySchema.optional(), OPENAPI_EXAMPLE_CITY),
      state: withOpenApiExample(organizationStateSchema.optional(), OPENAPI_EXAMPLE_STATE),
      address: withOpenApiExample(
        organizationAddressSchema.optional(),
        OPENAPI_EXAMPLE_ORGANIZATION_ADDRESS,
      ),
      zipCode: withOpenApiExample(organizationZipCodeSchema.optional(), OPENAPI_EXAMPLE_ZIP_CODE),
      phone: withOpenApiExample(organizationPhoneSchema.optional(), OPENAPI_EXAMPLE_PHONE),
      institutionalEmail: withOpenApiExample(
        organizationInstitutionalEmailSchema.optional(),
        OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL,
      ),
      website: organizationWebsiteUpdateSchema,
      logoUrl: organizationLogoUrlUpdateSchema,
      authorityName: withOpenApiExample(
        organizationAuthorityNameSchema.optional(),
        OPENAPI_EXAMPLE_PERSON_NAME,
      ),
      authorityRole: withOpenApiExample(
        organizationAuthorityRoleSchema.optional(),
        OPENAPI_EXAMPLE_ROLE_NAME,
      ),
      isActive: withOpenApiExample(z.boolean().optional(), true),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided.",
    }),
  updateOrganizationBodyExample,
);

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
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
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
    ...pickErrorResponses(400, 401, 403, 500),
  },
} satisfies AppRouteSchema;

export const getOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Get organization",
  params: organizationParamsSchema,
  response: {
    200: organizationSchema,
    ...pickErrorResponses(400, 401, 403, 404, 500),
  },
} satisfies AppRouteSchema;

export const updateOrganizationSchema = {
  tags: ["Organizations"],
  summary: "Update organization",
  params: organizationParamsSchema,
  body: updateOrganizationBodySchema,
  response: {
    200: organizationSchema,
    ...pickErrorResponses(400, 401, 403, 404, 409, 500),
  },
} satisfies AppRouteSchema;
