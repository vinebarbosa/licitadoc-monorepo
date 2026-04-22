import type { FastifyZodOpenApiSchema, FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import * as z from "zod/v4";

export { z };

export type AppRouteSchema = FastifyZodOpenApiSchema;
export type AppTypeProvider = FastifyZodOpenApiTypeProvider;

export const OPENAPI_EXAMPLE_EMAIL = "user@example.com";
export const OPENAPI_EXAMPLE_INSTITUTIONAL_EMAIL = "contato@example.gov.br";
export const OPENAPI_EXAMPLE_UUID = "123e4567-e89b-12d3-a456-426614174000";
export const OPENAPI_EXAMPLE_UUID_LIST = [OPENAPI_EXAMPLE_UUID];
export const OPENAPI_EXAMPLE_SLUG = "departamento-de-compras";
export const OPENAPI_EXAMPLE_NAME = "Departamento de Compras";
export const OPENAPI_EXAMPLE_PERSON_NAME = "Maria Silva";
export const OPENAPI_EXAMPLE_ROLE_NAME = "Diretora Administrativa";
export const OPENAPI_EXAMPLE_TEXT = "Texto de exemplo";
export const OPENAPI_EXAMPLE_DATE_TIME = "2026-01-15T10:30:00.000Z";
export const OPENAPI_EXAMPLE_URL = "https://licitadoc.example.gov.br";
export const OPENAPI_EXAMPLE_CNPJ = "12.345.678/0001-90";
export const OPENAPI_EXAMPLE_ZIP_CODE = "60000-000";
export const OPENAPI_EXAMPLE_PHONE = "(85) 3333-4444";
export const OPENAPI_EXAMPLE_CITY = "Fortaleza";
export const OPENAPI_EXAMPLE_STATE = "CE";
export const OPENAPI_EXAMPLE_PROCESS_NUMBER = "PE-2026-0001";
export const OPENAPI_EXAMPLE_PROCESS_STATUS = "draft";

export function withOpenApiExample<TSchema extends z.ZodType>(schema: TSchema, example: unknown) {
  return schema.meta({ example }) as TSchema;
}

const uuidRuntimeSchema = z.uuid();
const emailRuntimeSchema = z.email();

export function openApiUuidSchema(example = OPENAPI_EXAMPLE_UUID) {
  return z
    .string()
    .refine((value) => uuidRuntimeSchema.safeParse(value).success, {
      message: "Invalid UUID.",
    })
    .meta({
      format: "uuid",
      example,
    });
}

export function openApiEmailSchema(example = OPENAPI_EXAMPLE_EMAIL) {
  return z
    .string()
    .refine((value) => emailRuntimeSchema.safeParse(value).success, {
      message: "Invalid email address.",
    })
    .meta({
      format: "email",
      example,
    });
}
