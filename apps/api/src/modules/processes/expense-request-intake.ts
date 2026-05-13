import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { StoredObject } from "../../shared/storage/types";
import { createProcess } from "./create-process";
import { parseExpenseRequestText } from "./expense-request-parser";
import {
  assertDepartmentIdsBelongToOrganization,
  deriveConciseProcessTitle,
} from "./processes.shared";

export type ExpenseRequestIntakeInput = {
  departmentIds?: string[];
  expenseRequestText: string;
  fileName?: string | null;
  organizationId?: string;
  sourceFile?: StoredObject | null;
  sourceLabel?: string | null;
};

type CreateExpenseRequestProcessInput = {
  actor: Actor;
  db: FastifyInstance["db"];
  input: ExpenseRequestIntakeInput;
};

function onlyDigits(value: string | null) {
  return value?.replace(/\D/g, "") ?? null;
}

function normalizeMatchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function resolveOrganization({
  actor,
  db,
  inputOrganizationId,
  sourceCnpj,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  inputOrganizationId?: string;
  sourceCnpj: string | null;
}) {
  if (actor.role === "admin") {
    const organization = inputOrganizationId
      ? await db.query.organizations.findFirst({
          where: (table, { eq }) => eq(table.id, inputOrganizationId),
        })
      : sourceCnpj
        ? await db.query.organizations.findFirst({
            where: (table, { eq }) => eq(table.cnpj, sourceCnpj),
          })
        : null;

    if (!organization) {
      throw new NotFoundError("Organization not found.");
    }

    return organization;
  }

  if (actor.role !== "organization_owner" && actor.role !== "member") {
    throw new ForbiddenError("You do not have permission to create processes.");
  }

  if (!actor.organizationId) {
    throw new BadRequestError("You do not belong to an organization.");
  }

  const actorOrganizationId = actor.organizationId;

  if (inputOrganizationId && inputOrganizationId !== actorOrganizationId) {
    throw new ForbiddenError("You cannot create processes outside your organization.");
  }

  const organization = await db.query.organizations.findFirst({
    where: (table, { eq }) => eq(table.id, actorOrganizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  if (sourceCnpj && onlyDigits(sourceCnpj) !== onlyDigits(organization.cnpj)) {
    throw new ForbiddenError("Expense request CNPJ does not match your organization.");
  }

  return organization;
}

async function resolveDepartmentIds({
  budgetUnitCode,
  budgetUnitName,
  db,
  departmentIds,
  organizationId,
}: {
  budgetUnitCode: string | null;
  budgetUnitName: string | null;
  db: FastifyInstance["db"];
  departmentIds?: string[];
  organizationId: string;
}) {
  if (departmentIds && departmentIds.length > 0) {
    await assertDepartmentIdsBelongToOrganization({ db, organizationId, departmentIds });

    return departmentIds;
  }

  const rows = await db.query.departments.findMany({
    where: (table, { eq }) => eq(table.organizationId, organizationId),
  });
  const budgetUnitMatches = budgetUnitCode
    ? rows.filter((department) => department.budgetUnitCode === budgetUnitCode)
    : [];

  if (budgetUnitMatches.length === 1) {
    return [budgetUnitMatches[0].id];
  }

  if (budgetUnitMatches.length > 1) {
    throw new BadRequestError("Expense request budget unit matches more than one department.");
  }

  if (budgetUnitName) {
    const normalizedBudgetUnitName = normalizeMatchText(budgetUnitName);
    const nameMatches = rows.filter((department) => {
      const normalizedName = normalizeMatchText(department.name);
      const normalizedSlug = normalizeMatchText(department.slug);

      return (
        normalizedName === normalizedBudgetUnitName ||
        normalizedSlug === normalizedBudgetUnitName ||
        normalizedName.includes(normalizedBudgetUnitName) ||
        normalizedBudgetUnitName.includes(normalizedName)
      );
    });

    if (nameMatches.length === 1) {
      return [nameMatches[0].id];
    }

    if (nameMatches.length > 1) {
      throw new BadRequestError("Expense request budget unit matches more than one department.");
    }
  }

  throw new BadRequestError("Expense request could not be matched to a department.");
}

export async function createProcessFromExpenseRequestText({
  actor,
  db,
  input,
}: CreateExpenseRequestProcessInput) {
  const parsed = parseExpenseRequestText(input.expenseRequestText);
  const organization = await resolveOrganization({
    actor,
    db,
    inputOrganizationId: input.organizationId,
    sourceCnpj: parsed.organizationCnpj,
  });
  const resolvedDepartmentIds = await resolveDepartmentIds({
    db,
    departmentIds: input.departmentIds,
    organizationId: organization.id,
    budgetUnitCode: parsed.budgetUnitCode,
    budgetUnitName: parsed.budgetUnitName,
  });

  return createProcess({
    actor,
    db,
    process: {
      procurementMethod: parsed.processType,
      biddingModality: null,
      processNumber: parsed.sourceReference,
      externalId: parsed.requestNumber,
      issuedAt: parsed.issueDate,
      title: deriveConciseProcessTitle({
        itemDescription: parsed.item.description,
        object: parsed.object,
        processNumber: parsed.sourceReference,
      }),
      object: parsed.object,
      justification: parsed.justification,
      responsibleName: parsed.responsibleName ?? "Não informado",
      status: "draft",
      organizationId: organization.id,
      departmentIds: resolvedDepartmentIds,
      items: parsed.item.description
        ? [
            {
              kind: "simple",
              code: parsed.item.code ?? "1",
              title: parsed.item.description,
              description: parsed.item.description,
              quantity: parsed.item.quantity,
              unit: parsed.item.unit ?? "un",
              unitValue: parsed.item.unitValue,
              totalValue: parsed.item.totalValue ?? parsed.totalValue,
            },
          ]
        : [],
    },
  });
}
