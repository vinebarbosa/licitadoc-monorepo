import { describe, expect, it } from "vitest";
import {
  applyExtractionToFormValues,
  buildProcessCreateRequest,
  formatProcessDetailDate,
  formatProcessListDate,
  getDefaultProcessCreationFormValues,
  getDefaultProcessesFilters,
  getProcessCreateErrorMessage,
  getProcessDetailBreadcrumbs,
  getProcessDetailDepartmentLabel,
  getProcessDetailDocumentActionLinks,
  getProcessDetailDocumentStatusConfig,
  getProcessDetailErrorMessage,
  getProcessEstimatedValueLabel,
  getProcessesFilterSearchParams,
  getProcessesQueryParams,
  getProcessStatusConfig,
  getProcessTypeLabel,
  hasProcessCreationErrors,
  mapDepartmentOptions,
  normalizeDateInput,
  validateProcessCreationForm,
} from "./processes";

describe("processes model helpers", () => {
  it("restores filters from URL params and builds API query params", () => {
    const filters = getDefaultProcessesFilters(
      new URLSearchParams("page=2&search=material&status=em_revisao&type=pregao-eletronico"),
    );

    expect(filters).toEqual({
      page: 2,
      search: "material",
      status: "em_revisao",
      type: "pregao-eletronico",
    });
    expect(getProcessesQueryParams(filters)).toEqual({
      page: 2,
      pageSize: 10,
      search: "material",
      status: "em_revisao",
      type: "pregao-eletronico",
    });
  });

  it("omits default filters from URL and API query params", () => {
    const filters = {
      page: 1,
      search: "",
      status: "todos",
      type: "todos",
    } as const;

    expect(getProcessesFilterSearchParams(filters).toString()).toBe("");
    expect(getProcessesQueryParams(filters)).toEqual({
      page: 1,
      pageSize: 10,
      search: undefined,
      status: undefined,
      type: undefined,
    });
  });

  it("formats labels and dates for the listing", () => {
    expect(getProcessStatusConfig("finalizado").label).toBe("Finalizado");
    expect(getProcessStatusConfig("desconhecido").label).toBe("Em edicao");
    expect(getProcessTypeLabel("pregao-eletronico")).toBe("Pregao Eletronico");
    expect(formatProcessListDate("2024-03-28T12:00:00.000Z")).toMatch(/28/);
  });

  it("builds process detail helpers for breadcrumbs, value fallback, and action links", () => {
    expect(
      getProcessDetailDepartmentLabel({
        departments: [{ label: "06.001 - Educacao" }, { label: "07.001 - Cultura" }] as Array<
          { label: string } & Record<string, unknown>
        >,
      } as never),
    ).toBe("06.001 - Educacao, 07.001 - Cultura");
    expect(getProcessEstimatedValueLabel(null)).toBe("Nao informado");
    expect(getProcessEstimatedValueLabel("450000")).toContain("R$");
    expect(getProcessDetailDocumentStatusConfig("concluido").label).toBe("Concluido");
    expect(
      getProcessDetailDocumentActionLinks("process-1", {
        type: "dfd",
        documentId: "document-1",
        availableActions: {
          create: false,
          edit: true,
          view: true,
        },
      }),
    ).toEqual({
      createHref: null,
      editHref: "/app/documento/document-1",
      viewHref: "/app/documento/document-1/preview",
    });
    expect(
      getProcessDetailDocumentActionLinks("process-1", {
        type: "tr",
        documentId: null,
        availableActions: {
          create: true,
          edit: false,
          view: false,
        },
      }).createHref,
    ).toBe("/app/documento/novo?tipo=tr&processo=process-1");
    expect(getProcessDetailBreadcrumbs({ processNumber: "PE-2024-045" } as never)[2]?.label).toBe(
      "PE-2024-045",
    );
    expect(formatProcessDetailDate(null)).toBe("Nao informado");
  });

  it("builds role-aware defaults and validates required creation fields", () => {
    const memberValues = getDefaultProcessCreationFormValues({
      role: "member",
      organizationId: "organization-1",
    });
    const adminValues = getDefaultProcessCreationFormValues({
      role: "admin",
      organizationId: null,
    });

    expect(memberValues.organizationId).toBe("organization-1");
    expect(adminValues.organizationId).toBe("");
    expect(memberValues.status).toBe("draft");

    const errors = validateProcessCreationForm(memberValues, {
      role: "member",
      organizationId: "organization-1",
    });

    expect(hasProcessCreationErrors(errors)).toBe(true);
    expect(errors.processNumber).toBe("Informe o numero do processo.");
    expect(errors.departmentIds).toBe("Selecione ao menos um departamento.");
  });

  it("maps creation form values to the manual process API payload", () => {
    const values = {
      ...getDefaultProcessCreationFormValues({
        role: "member",
        organizationId: "organization-1",
      }),
      type: " pregao ",
      processNumber: " PROC-1 ",
      externalId: " EXT-1 ",
      issuedAt: "2026-01-08",
      object: " Objeto ",
      justification: " Justificativa ",
      responsibleName: " Maria ",
      departmentIds: ["department-1"],
    };

    expect(
      buildProcessCreateRequest(values, {
        role: "member",
        organizationId: "organization-1",
      }),
    ).toEqual({
      type: "pregao",
      processNumber: "PROC-1",
      externalId: "EXT-1",
      issuedAt: "2026-01-08T00:00:00.000Z",
      object: "Objeto",
      justification: "Justificativa",
      responsibleName: "Maria",
      status: "draft",
      departmentIds: ["department-1"],
      sourceKind: null,
      sourceReference: null,
      sourceMetadata: null,
    });
  });

  it("keeps admin organization and maps departments for creation helpers", () => {
    const values = {
      ...getDefaultProcessCreationFormValues({
        role: "admin",
        organizationId: null,
      }),
      type: "pregao",
      processNumber: "PROC-ADMIN",
      issuedAt: "2026-01-08",
      object: "Objeto",
      justification: "Justificativa",
      responsibleName: "Maria",
      organizationId: "organization-2",
      departmentIds: ["department-2"],
    };

    expect(
      buildProcessCreateRequest(values, {
        role: "admin",
        organizationId: null,
      }).organizationId,
    ).toBe("organization-2");
    expect(
      mapDepartmentOptions([
        {
          id: "department-2",
          name: "Educacao",
          slug: "educacao",
          organizationId: "organization-2",
          budgetUnitCode: "06.001",
          responsibleName: "Ana",
          responsibleRole: "Secretaria",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    ).toEqual([
      {
        id: "department-2",
        label: "06.001 - Educacao",
        organizationId: "organization-2",
        budgetUnitCode: "06.001",
      },
    ]);
  });

  it("normalizes dates, extracts backend messages, and applies extraction without overwriting dirty fields", () => {
    const currentValues = getDefaultProcessCreationFormValues({
      role: "member",
      organizationId: "organization-1",
    });
    const extraction = {
      fileName: "SD.pdf",
      rawText: "text",
      suggestions: {
        processNumber: "SD-6-2026",
        object: "Objeto extraido",
      },
      extractedFields: {
        budgetUnitCode: null,
        budgetUnitName: null,
        issueDate: null,
        item: {
          code: null,
          description: null,
          quantity: null,
          unit: null,
          unitValue: null,
          totalValue: null,
        },
        itemDescription: null,
        object: "Objeto extraido",
        organizationCnpj: null,
        organizationName: null,
        processType: null,
        requestNumber: "6",
        responsibleName: null,
        responsibleRole: null,
        totalValue: null,
      },
      warnings: [],
    };

    expect(normalizeDateInput("2026-01-08T00:00:00.000Z")).toBe("2026-01-08");
    expect(
      getProcessCreateErrorMessage({
        data: { message: "Process number already exists." },
      }),
    ).toBe("Process number already exists.");
    expect(
      applyExtractionToFormValues({ ...currentValues, object: "Objeto digitado" }, extraction, {
        object: true,
      }).object,
    ).toBe("Objeto digitado");
    expect(
      getProcessDetailErrorMessage({
        data: { message: "Process detail unavailable." },
      }),
    ).toBe("Process detail unavailable.");
  });
});
