import { config } from "dotenv";
import fp from "fastify-plugin";
import { z } from "zod";

function parseBooleanEnv(defaultValue: boolean) {
  return z
    .string()
    .optional()
    .transform((value) => {
      if (value == null) {
        return defaultValue;
      }

      return value.toLowerCase() === "true";
    });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/licitadoc"),
  BETTER_AUTH_SECRET: z.string().default("change-me"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3333"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  INVITE_EMAIL_PROVIDER: z.enum(["stub", "resend"]).default("stub"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  TEXT_GENERATION_PROVIDER: z.string().default("stub"),
  TEXT_GENERATION_MODEL: z.string().default("gpt-4.1-mini"),
  TEXT_GENERATION_API_KEY: z.string().optional(),
  TEXT_GENERATION_BASE_URL: z.string().optional(),
  TEXT_GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  STORAGE_PROVIDER: z.string().default("s3"),
  STORAGE_S3_ENDPOINT: z.string().default("http://localhost:4566"),
  STORAGE_S3_REGION: z.string().default("us-east-1"),
  STORAGE_S3_BUCKET: z.string().default("licitadoc-expense-requests"),
  STORAGE_S3_ACCESS_KEY_ID: z.string().default("test"),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().default("test"),
  STORAGE_S3_FORCE_PATH_STYLE: parseBooleanEnv(true),
  EXPENSE_REQUEST_PDF_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(3 * 1024 * 1024),
});

declare module "fastify" {
  interface FastifyInstance {
    config: z.infer<typeof envSchema>;
  }
}

export const registerEnvPlugin = fp(async (app) => {
  config();

  const parsedEnv = parseApiEnv(process.env);
  app.decorate("config", parsedEnv);
});

export function parseApiEnv(env: NodeJS.ProcessEnv) {
  return envSchema.parse(env);
}
