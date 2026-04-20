import type { FastifyZodOpenApiSchema, FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import * as z from "zod/v4";

export { z };

export type AppRouteSchema = FastifyZodOpenApiSchema;
export type AppTypeProvider = FastifyZodOpenApiTypeProvider;
