import { config } from "dotenv";
import fp from "fastify-plugin";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/licitadoc"),
  BETTER_AUTH_SECRET: z.string().default("change-me"),
  BETTER_AUTH_URL: z.string().default("http://localhost:3333"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

declare module "fastify" {
  interface FastifyInstance {
    config: z.infer<typeof envSchema>;
  }
}

export const registerEnvPlugin = fp(async (app) => {
  config();

  const parsedEnv = envSchema.parse(process.env);
  app.decorate("config", parsedEnv);
});
