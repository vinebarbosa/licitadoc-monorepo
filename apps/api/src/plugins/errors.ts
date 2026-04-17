import fp from "fastify-plugin";
import { AppError } from "../shared/errors/app-error";

export const registerErrorPlugin = fp(async (app) => {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details ?? null,
      });
    }

    app.log.error(error);

    return reply.status(500).send({
      error: "internal_server_error",
      message: "An unexpected error occurred.",
    });
  });
});
