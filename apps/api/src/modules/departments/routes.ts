import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createDepartment } from "./create-department";
import {
  createDepartmentSchema,
  getDepartmentSchema,
  getDepartmentsSchema,
  updateDepartmentSchema,
} from "./departments.schemas";
import { getDepartment } from "./get-department";
import { getDepartments } from "./get-departments";
import { updateDepartment } from "./update-department";

export const registerDepartmentRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  // Department deletion remains out of scope for this change.
  app.post(
    "/",
    {
      schema: createDepartmentSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const department = await createDepartment({
        actor,
        db: app.db,
        department: request.body,
      });

      return reply.status(201).send(department);
    },
  );

  app.get(
    "/",
    {
      schema: getDepartmentsSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getDepartments({
        actor,
        db: app.db,
        page: request.query.page,
        pageSize: request.query.pageSize,
      });
    },
  );

  app.get(
    "/:departmentId",
    {
      schema: getDepartmentSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { departmentId } = request.params;

      return getDepartment({
        actor,
        db: app.db,
        departmentId,
      });
    },
  );

  app.patch(
    "/:departmentId",
    {
      schema: updateDepartmentSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { departmentId } = request.params;

      return updateDepartment({
        actor,
        db: app.db,
        departmentId,
        changes: request.body,
      });
    },
  );
};
