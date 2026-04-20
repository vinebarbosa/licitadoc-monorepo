import fp from "fastify-plugin";
import { AppError } from "../shared/errors/app-error";

function isValidationError(error: unknown): error is {
  code: string;
  message: string;
  statusCode: number;
  validation?: unknown;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "code" in error &&
    "message" in error
  );
}

export const registerErrorPlugin = fp(async (app) => {
  app.setErrorHandler((error, _request, reply) => {
    if (
      isValidationError(error) &&
      error.statusCode === 400 &&
      error.code === "FST_ERR_VALIDATION"
    ) {
      return reply.status(400).send({
        error: "validation_error",
        message: error.message,
        details: error.validation ?? null,
      });
    }

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
