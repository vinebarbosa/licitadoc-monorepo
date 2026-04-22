import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { createProcessFromExpenseRequestText } from "./expense-request-intake";
import type { CreateProcessFromExpenseRequestInput } from "./processes.schemas";

type Input = {
  actor: Actor;
  db: FastifyInstance["db"];
  request: CreateProcessFromExpenseRequestInput;
};

export async function createProcessFromExpenseRequest({ actor, db, request }: Input) {
  return createProcessFromExpenseRequestText({
    actor,
    db,
    input: {
      expenseRequestText: request.expenseRequestText,
      fileName: request.fileName,
      organizationId: request.organizationId,
      departmentIds: request.departmentIds,
      sourceLabel: request.sourceLabel,
    },
  });
}
