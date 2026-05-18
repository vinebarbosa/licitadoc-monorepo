import { describe, expect, it } from "vitest";
import { parseTopDownExpenseRequestText } from "../model/expense-request-pdf";
import { getEmptyProcessFormValues, type ProcessItem } from "./process-form-wizard";
import { applySdImportToProcessForm } from "./sd-import-flow";

const expenseRequestText = `
PRACA 05 DE ABRIL, 180, CENTRO
CNPJ: 08.290.223/0001-42
Solicitacao de Despesa
MUNICIPIO DE PUREZA
Unidade Orcamentaria: 06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer
N Solicitacao:
6
Data Emissao:
08/01/2026
Processo:
Servico
Classificacao:
Contratacao de apresentacao artistica musical
Objeto:
Justificativa da necessidade.
Item Descricao
Contratacao de show 12345 1 10.000,00 10.000,00 UND
Valor Total
10.000,00
Secretaria Municipal
Maria Responsavel
123.456.789-00
`;

const organizations = [
  {
    id: "organization-1",
    name: "Municipio de Pureza",
    cnpj: "08.290.223/0001-42",
  },
  {
    id: "organization-2",
    name: "Outra Prefeitura",
    cnpj: "11.111.111/0001-11",
  },
];

const departments = [
  {
    id: "department-1",
    name: "Secretaria de Educacao",
    organizationId: "organization-1",
    budgetUnitCode: "06.001",
  },
  {
    id: "department-2",
    name: "Secretaria de Saude",
    organizationId: "organization-1",
    budgetUnitCode: "07.001",
  },
];

describe("SD import form mapping", () => {
  it("maps a successful extraction to the current wizard values", () => {
    const extraction = parseTopDownExpenseRequestText(expenseRequestText, "SD.pdf");
    const currentValues = getEmptyProcessFormValues("organization-1");
    const result = applySdImportToProcessForm({
      currentValues,
      departments,
      extraction,
      forcedOrganizationId: "organization-1",
      organizations,
      showOrganizationSelect: false,
    });

    expect(result.values).toMatchObject({
      processNumber: "SD-6-2026",
      externalId: "6",
      issuedAt: "2026-01-08",
      organizationId: "organization-1",
      departmentIds: ["department-1"],
      object: "Contratacao de apresentacao artistica musical",
      justification: "Justificativa da necessidade.",
      responsibleName: "Maria Responsavel",
    });
    expect(result.values.items).toBe(currentValues.items);
    expect(result.values.items).toEqual([]);
    expect(result.summary).toMatchObject({
      fileName: "SD.pdf",
      sourceReference: "SD-6-2026",
      budgetUnitCode: "06.001",
      warnings: [],
    });
  });

  it("keeps a non-admin forced organization even when the SD has another CNPJ", () => {
    const extraction = parseTopDownExpenseRequestText(expenseRequestText, "SD.pdf");
    const result = applySdImportToProcessForm({
      currentValues: getEmptyProcessFormValues("organization-2"),
      departments,
      extraction,
      forcedOrganizationId: "organization-2",
      organizations,
      showOrganizationSelect: false,
    });

    expect(result.values.organizationId).toBe("organization-2");
    expect(result.values.departmentIds).toEqual([]);
    expect(result.summary.warnings).toContain("department_match_missing");
  });

  it("selects the matching organization by CNPJ for admins", () => {
    const extraction = parseTopDownExpenseRequestText(expenseRequestText, "SD.pdf");
    const result = applySdImportToProcessForm({
      currentValues: getEmptyProcessFormValues(""),
      departments,
      extraction,
      organizations,
      showOrganizationSelect: true,
    });

    expect(result.values.organizationId).toBe("organization-1");
    expect(result.values.departmentIds).toEqual(["department-1"]);
    expect(result.summary.warnings).not.toContain("organization_match_missing");
  });

  it("preserves manually entered items after SD apply and reapply", () => {
    const extraction = parseTopDownExpenseRequestText(expenseRequestText, "SD.pdf");
    const manualItems: ProcessItem[] = [
      {
        id: "manual-item-1",
        kind: "simple",
        code: "0005909",
        title: "Pote plastico",
        description: "Pote plastico com tampa",
        quantity: "2",
        unit: "UN",
        unitValue: "12,50",
        totalValue: "25.00",
        components: [],
      },
    ];
    const firstResult = applySdImportToProcessForm({
      currentValues: {
        ...getEmptyProcessFormValues("organization-1"),
        items: manualItems,
      },
      departments,
      extraction,
      forcedOrganizationId: "organization-1",
      organizations,
      showOrganizationSelect: false,
    });
    const secondResult = applySdImportToProcessForm({
      currentValues: firstResult.values,
      departments,
      extraction,
      forcedOrganizationId: "organization-1",
      organizations,
      showOrganizationSelect: false,
    });

    expect(firstResult.values.items).toBe(manualItems);
    expect(secondResult.values.items).toBe(manualItems);
    expect(secondResult.values.items).toEqual(manualItems);
  });

  it("reports unmatched organization and department references", () => {
    const extraction = parseTopDownExpenseRequestText(expenseRequestText, "SD.pdf");
    const result = applySdImportToProcessForm({
      currentValues: getEmptyProcessFormValues(""),
      departments: [],
      extraction,
      organizations: [
        {
          id: "organization-3",
          name: "Prefeitura sem CNPJ correspondente",
          cnpj: "22.222.222/0001-22",
        },
      ],
      showOrganizationSelect: true,
    });

    expect(result.values.organizationId).toBe("");
    expect(result.values.departmentIds).toEqual([]);
    expect(result.summary.warnings).toEqual(
      expect.arrayContaining(["organization_match_missing", "department_match_missing"]),
    );
  });
});
