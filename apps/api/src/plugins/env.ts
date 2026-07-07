import { config } from "dotenv";
import fp from "fastify-plugin";
import { z } from "zod";

function parseBooleanEnv(defaultValue: boolean) {
  return z
    .string()
    .optional()
    .transform((value, context) => {
      if (value == null) {
        return defaultValue;
      }

      const normalizedValue = value.trim().toLowerCase();

      if (normalizedValue === "true") {
        return true;
      }

      if (normalizedValue === "false") {
        return false;
      }

      context.addIssue({
        code: "custom",
        message: 'Expected boolean environment value to be "true" or "false".',
      });

      return z.NEVER;
    });
}

function parseOptionalUrlEnv() {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional(),
  );
}

const DEFAULT_INVITE_EMAIL_BRAND_MARK_URL =
  "https://50luyxulth2yamqj.public.blob.vercel-storage.com/brand/licitadoc-email-mark.png";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/licitadoc"),
  BETTER_AUTH_SECRET: z.string().default("change-me"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3333"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  INVITE_EMAIL_PROVIDER: z.enum(["stub", "resend"]).default("stub"),
  INVITE_EMAIL_BRAND_MARK_URL: z.string().url().default(DEFAULT_INVITE_EMAIL_BRAND_MARK_URL),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  TEXT_GENERATION_PROVIDER: z.string().default("stub"),
  TEXT_GENERATION_MODEL: z.string().default("gpt-4.1-mini"),
  TEXT_GENERATION_API_KEY: z.string().optional(),
  TEXT_GENERATION_BASE_URL: z.string().optional(),
  TEXT_GENERATION_COMBINE_WRITER_HUMANIZATION: parseBooleanEnv(false),
  TEXT_GENERATION_STRUCTURED_OUTPUT: parseBooleanEnv(false),
  TEXT_GENERATION_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  STORAGE_PROVIDER: z.enum(["s3", "vercel-blob"]).default("s3"),
  STORAGE_S3_ENDPOINT: z.string().default("http://localhost:4566"),
  STORAGE_S3_REGION: z.string().default("us-east-1"),
  STORAGE_S3_BUCKET: z.string().default("licitadoc-expense-requests"),
  STORAGE_S3_ACCESS_KEY_ID: z.string().default("test"),
  STORAGE_S3_SECRET_ACCESS_KEY: z.string().default("test"),
  STORAGE_S3_FORCE_PATH_STYLE: parseBooleanEnv(true),
  STORAGE_VERCEL_BLOB_ACCESS: z.enum(["private", "public"]).default("public"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  EXPENSE_REQUEST_PDF_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(3 * 1024 * 1024),
  SUPPORT_IMAGE_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
  ORGANIZATION_VISUAL_ASSET_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
  ORGANIZATION_LETTERHEAD_TEMPLATE_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(20 * 1024 * 1024),
  LETTERHEAD_GOTENBERG_URL: parseOptionalUrlEnv(),
  LETTERHEAD_DOCX_CONVERSION_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  REALTIME_PROVIDER: z.enum(["disabled", "ably"]).default("disabled"),
  ABLY_API_KEY: z.string().optional(),
  REALTIME_TOKEN_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 1000),
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
