import type { FastifyPluginAsync } from "fastify";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { getProcess } from "./get-process";
import { getProcesses } from "./get-processes";
import { getProcessesSchema, getProcessSchema } from "./processes.schemas";

export const registerProcessRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/",
    {
      schema: getProcessesSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getProcesses({ actor, db: app.db });
    },
  );

  app.get(
    "/:processId",
    {
      schema: getProcessSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { processId } = request.params as { processId: string };

      return getProcess({ actor, db: app.db, processId });
    },
  );
};
