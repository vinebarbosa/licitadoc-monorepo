import { drizzle } from "drizzle-orm/node-postgres";
import fp from "fastify-plugin";
import { Pool } from "pg";
import * as schema from "../db";

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

declare module "fastify" {
  interface FastifyInstance {
    db: AppDatabase;
    pg: Pool;
  }
}

export const registerDatabasePlugin = fp(async (app) => {
  const pool = new Pool({
    connectionString: app.config.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  app.decorate("pg", pool);
  app.decorate("db", db);

  app.addHook("onClose", async () => {
    await pool.end();
  });
});
