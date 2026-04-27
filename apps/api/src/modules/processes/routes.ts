import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createProcess } from "./create-process";
import { createProcessFromExpenseRequest } from "./create-process-from-expense-request";
import {
  createProcessFromExpenseRequestPdf,
  normalizeExpenseRequestPdfUpload,
} from "./expense-request-pdf";
import { getProcess } from "./get-process";
import { getProcesses } from "./get-processes";
import {
  createProcessFromExpenseRequestPdfSchema,
  createProcessFromExpenseRequestSchema,
  createProcessSchema,
  getProcessesSchema,
  getProcessSchema,
  updateProcessSchema,
} from "./processes.schemas";
import { updateProcess } from "./update-process";

export const registerProcessRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    "/",
    {
      schema: createProcessSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const process = await createProcess({
        actor,
        db: app.db,
        process: request.body,
      });

      return reply.status(201).send(process);
    },
  );

  app.get(
    "/",
    {
      schema: getProcessesSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getProcesses({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
        search: request.query.search,
        status: request.query.status,
        type: request.query.type,
      });
    },
  );

  app.post(
    "/from-expense-request",
    {
      schema: createProcessFromExpenseRequestSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const process = await createProcessFromExpenseRequest({
        actor,
        db: app.db,
        request: request.body,
      });

      return reply.status(201).send(process);
    },
  );

  app.post(
    "/from-expense-request/pdf",
    {
      schema: createProcessFromExpenseRequestPdfSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const input = await normalizeExpenseRequestPdfUpload({
        body: request.body as Record<string, unknown> | undefined,
        maxBytes: app.config.EXPENSE_REQUEST_PDF_MAX_BYTES,
      });
      const process = await createProcessFromExpenseRequestPdf({
        actor,
        db: app.db,
        input,
        storage: app.storage,
      });

      return reply.status(201).send(process);
    },
  );

  app.get(
    "/:processId",
    {
      schema: getProcessSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { processId } = request.params;

      return getProcess({ actor, db: app.db, processId });
    },
  );

  app.patch(
    "/:processId",
    {
      schema: updateProcessSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { processId } = request.params;

      return updateProcess({
        actor,
        db: app.db,
        processId,
        changes: request.body,
      });
    },
  );
};
