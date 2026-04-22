import { z } from "./zod";

const nullableUnknownSchema = z.unknown().nullable();

export const validationErrorResponseSchema = z.object({
  error: z.literal("validation_error"),
  message: z.string(),
  details: nullableUnknownSchema,
});

function appErrorResponseSchema(code: string) {
  return z.object({
    error: z.literal(code),
    message: z.string(),
    details: nullableUnknownSchema,
  });
}

export const badRequestErrorResponseSchema = appErrorResponseSchema("bad_request");
export const unauthorizedErrorResponseSchema = appErrorResponseSchema("unauthorized");
export const forbiddenErrorResponseSchema = appErrorResponseSchema("forbidden");
export const notFoundErrorResponseSchema = appErrorResponseSchema("not_found");
export const conflictErrorResponseSchema = appErrorResponseSchema("conflict");

export const internalServerErrorResponseSchema = z.object({
  error: z.literal("internal_server_error"),
  message: z.string(),
});

export const status400ErrorResponseSchema = z.union([
  validationErrorResponseSchema,
  badRequestErrorResponseSchema,
]);

export const routeErrorResponseSchemas = {
  400: status400ErrorResponseSchema,
  401: unauthorizedErrorResponseSchema,
  403: forbiddenErrorResponseSchema,
  404: notFoundErrorResponseSchema,
  409: conflictErrorResponseSchema,
  500: internalServerErrorResponseSchema,
} as const;

export type RouteErrorStatus = keyof typeof routeErrorResponseSchemas;

export function pickErrorResponses<const T extends readonly RouteErrorStatus[]>(...statuses: T) {
  const responseEntries = statuses.map(
    (status) => [status, routeErrorResponseSchemas[status]] as const,
  );

  return Object.fromEntries(responseEntries) as Pick<typeof routeErrorResponseSchemas, T[number]>;
}
