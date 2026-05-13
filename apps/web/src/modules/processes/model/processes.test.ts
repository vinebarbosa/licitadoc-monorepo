import { describe, expect, it } from "vitest";
import {
  addExpenseRequestComponentToItem,
  applyExtractionToFormValues,
  buildProcessCreateRequest,
  calculateExpenseRequestItemTotalValue,
  createEmptyExpenseRequestFormItem,
  deriveProcessTitlePreview,
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
  getProcessDetailItems,
  getProcessEstimatedValueLabel,
  getProcessesFilterSearchParams,
  getProcessesQueryParams,
  getProcessStatusConfig,
  getProcessTypeLabel,
  hasProcessCreationErrors,
  mapDepartmentOptions,
  normalizeDateInput,
  removeExpenseRequestComponentFromItem,
  setExpenseRequestItemKind,
  toExpenseRequestFormItems,
  updateExpenseRequestComponentField,
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
      procurementMethod: "pregao-eletronico",
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
      procurementMethod: "todos",
    } as const;

    expect(getProcessesFilterSearchParams(filters).toString()).toBe("");
    expect(getProcessesQueryParams(filters)).toEqual({
      page: 1,
      pageSize: 10,
      search: undefined,
      status: undefined,
      procurementMethod: undefined,
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
      regenerateHref: "/app/documento/novo?tipo=dfd&processo=process-1",
      editHref: "/app/documento/document-1",
      viewHref: "/app/documento/document-1/preview",
    });
    const pendingDocumentActionLinks = getProcessDetailDocumentActionLinks("process-1", {
      type: "tr",
      documentId: null,
      availableActions: {
        create: true,
        edit: false,
        view: false,
      },
    });

    expect(pendingDocumentActionLinks.createHref).toBe(
      "/app/documento/novo?tipo=tr&processo=process-1",
    );
    expect(pendingDocumentActionLinks.regenerateHref).toBeNull();
    expect(getProcessDetailBreadcrumbs({ processNumber: "PE-2024-045" } as never)[2]?.label).toBe(
      "PE-2024-045",
    );
    expect(formatProcessDetailDate(null)).toBe("Nao informado");
  });

  it("normalizes process detail items from array, components, and legacy singular metadata", () => {
    const items = getProcessDetailItems({
      sourceMetadata: {
        extractedFields: {
          items: [
            {
              code: "1",
              description: "  Pote plástico   com tampa  ",
              quantity: 500,
              unit: "unidade",
              unitValue: "R$ 8,50",
              totalValue: "R$ 4.250,00",
              components: [
                {
                  title: "Tampa",
                  quantity: "1",
                  unit: "unidade",
                },
              ],
            },
            {
              quantity: "sem descricao",
            },
          ],
        },
      },
    } as never);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      code: "1",
      title: "Pote plástico com tampa",
      description: null,
      quantity: "500",
      unit: "unidade",
      unitValue: "R$ 8,50",
      totalValue: "R$ 4.250,00",
    });
    expect(items[0]?.components).toEqual([
      {
        id: "component-0",
        title: "Tampa",
        description: null,
        quantity: "1",
        unit: "unidade",
      },
    ]);

    expect(
      getProcessDetailItems({
        sourceMetadata: {
          extractedFields: {
            item: {
              code: "LEG-1",
              description: "Item legado",
            },
          },
        },
      } as never),
    ).toMatchObject([{ code: "LEG-1", title: "Item legado" }]);
  });

  it("ignores malformed process detail item metadata", () => {
    expect(getProcessDetailItems({ sourceMetadata: null } as never)).toEqual([]);
    expect(
      getProcessDetailItems({
        sourceMetadata: {
          extractedFields: {
            items: [null, {}, { quantity: "2" }, "texto"],
            item: {
              quantity: "1",
            },
          },
        },
      } as never),
    ).toEqual([]);
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
      title: " Titulo enxuto ",
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
      title: "Titulo enxuto",
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
      title: "Objeto",
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

  it("preserves legacy SD source metadata for imported process payloads", () => {
    const sourceMetadata = {
      extractedFields: {
        item: {
          code: "0005113",
          description: "KIT ESCOLAR: EDUCACAO INFANTIL",
          quantity: "550",
          unit: "KIT",
          unitValue: "0,00",
          totalValue: "0,00",
        },
        itemDescription: "KIT ESCOLAR: EDUCACAO INFANTIL",
      },
      warnings: [],
    };
    const values = {
      ...getDefaultProcessCreationFormValues({
        role: "member",
        organizationId: "organization-1",
      }),
      type: "pregao",
      processNumber: "SD-6-2026",
      issuedAt: "2026-01-08",
      title: "Kits escolares",
      object: "Aquisicao de kits escolares",
      justification: "Atendimento ao ano letivo.",
      responsibleName: "Maria",
      departmentIds: ["department-1"],
      sourceKind: "expense_request",
      sourceReference: "SD-6-2026",
      sourceMetadata,
    };

    const payload = buildProcessCreateRequest(values, {
      role: "member",
      organizationId: "organization-1",
    });

    expect("sourceMetadata" in payload).toBe(false);
  });

  it("serializes reviewed SD items into structured process items", () => {
    const values = {
      ...getDefaultProcessCreationFormValues({
        role: "member",
        organizationId: "organization-1",
      }),
      type: "pregao",
      processNumber: "PROC-ITENS",
      issuedAt: "2026-04-30",
      title: "Dias das maes",
      object: "Aquisicao de materiais",
      justification: "Distribuicao gratuita.",
      responsibleName: "Maria",
      departmentIds: ["department-1"],
      expenseRequestItems: [
        {
          id: "item-1",
          kind: "simple" as const,
          code: " 0005909 ",
          title: " Pote plastico ",
          description: " Pote plastico ",
          quantity: " 550 ",
          unit: " UN ",
          unitValue: " 0,00 ",
          totalValue: " 0,00 ",
          components: [],
          source: "manual" as const,
        },
        {
          id: "item-empty",
          kind: "simple" as const,
          code: " ",
          title: " ",
          description: " ",
          quantity: "",
          unit: "",
          unitValue: "",
          totalValue: "",
          components: [],
          source: "manual" as const,
        },
      ],
    };

    const payload = buildProcessCreateRequest(values, {
      role: "member",
      organizationId: "organization-1",
    });

    expect(payload.items).toMatchObject([
      {
        kind: "simple",
        code: "0005909",
        title: "Pote plastico",
        description: "Pote plastico",
        quantity: "550",
        unit: "UN",
        unitValue: "0,00",
        totalValue: "0,00",
      },
    ]);
  });

  it("builds native simple and kit item helpers", () => {
    const simpleItem = createEmptyExpenseRequestFormItem();
    const kitItem = setExpenseRequestItemKind(simpleItem, "kit");
    const kitWithComponent = addExpenseRequestComponentToItem(kitItem);
    const componentId = kitWithComponent.components[0]?.id ?? "";
    const updatedKit = updateExpenseRequestComponentField(
      kitWithComponent,
      componentId,
      "title",
      "Caderno",
    );

    expect(simpleItem.kind).toBe("simple");
    expect(kitItem.kind).toBe("kit");
    expect(updatedKit.components[0]?.title).toBe("Caderno");
    expect(removeExpenseRequestComponentFromItem(updatedKit, componentId).components).toEqual([]);
  });

  it("calculates item totals and maps PDF rows into native simple items", () => {
    expect(calculateExpenseRequestItemTotalValue("10", "R$ 8,50")?.replace(/\s/g, " ")).toBe(
      "R$ 85,00",
    );
    expect(calculateExpenseRequestItemTotalValue("abc", "R$ 8,50")).toBeNull();

    expect(
      toExpenseRequestFormItems(
        [
          {
            code: "1",
            title: null,
            description: "Linha PDF",
            quantity: "2",
            unit: "UN",
            unitValue: "R$ 5,00",
            totalValue: null,
          },
        ],
        "pdf",
      ),
    ).toMatchObject([
      {
        kind: "simple",
        description: "Linha PDF",
        components: [],
        source: "pdf",
      },
    ]);
  });

  it("replaces imported metadata item evidence with reviewed rows", () => {
    const values = {
      ...getDefaultProcessCreationFormValues({
        role: "member",
        organizationId: "organization-1",
      }),
      type: "pregao",
      processNumber: "SD-53-2026",
      issuedAt: "2026-04-30",
      title: "Dias das maes",
      object: "Aquisicao de materiais",
      justification: "Distribuicao gratuita.",
      responsibleName: "Maria",
      departmentIds: ["department-1"],
      sourceKind: "expense_request",
      sourceReference: "SD-53-2026",
      sourceMetadata: {
        extractedFields: {
          requestNumber: "53",
          item: {
            code: "old",
          },
        },
        source: {
          fileName: "SD.pdf",
        },
        warnings: ["item_rows_missing"],
      },
      expenseRequestItems: [
        {
          id: "item-1",
          kind: "kit" as const,
          code: "0005910",
          title: "Kit com 2 potes",
          description: "Kit com 2 potes",
          quantity: "550",
          unit: "KIT",
          unitValue: "0,00",
          totalValue: "0,00",
          components: [
            {
              id: "component-1",
              title: "Pote 1L",
              description: "Pote plastico de 1L",
              quantity: "2",
              unit: "unidade",
            },
          ],
          source: "pdf" as const,
        },
      ],
    };

    const payload = buildProcessCreateRequest(values, {
      role: "member",
      organizationId: "organization-1",
    });

    expect(payload.items).toMatchObject([
      {
        kind: "kit",
        code: "0005910",
        title: "Kit com 2 potes",
        components: [
          {
            title: "Pote 1L",
            description: "Pote plastico de 1L",
            quantity: "2",
            unit: "unidade",
          },
        ],
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
        title: "Titulo extraido",
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
      applyExtractionToFormValues({ ...currentValues, title: "Titulo digitado" }, extraction, {
        title: true,
      }).title,
    ).toBe("Titulo digitado");
    expect(
      deriveProcessTitlePreview({
        object:
          "Contratacao de empresa especializada para prestacao de servicos tecnicos de assessoria e suporte em Recursos Humanos, de execucao indireta",
      }),
    ).toBe("Prestacao de servicos tecnicos de assessoria e suporte em Recursos Humanos");
    expect(
      getProcessDetailErrorMessage({
        data: { message: "Process detail unavailable." },
      }),
    ).toBe("Process detail unavailable.");
  });
});
