import cors from "@fastify/cors";
import fp from "fastify-plugin";

export const registerCorsPlugin = fp(async (app) => {
  const origins = app.config.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: origins,
    credentials: true,
  });
});
