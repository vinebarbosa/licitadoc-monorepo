import { describe, expect, it } from "vitest";
import {
  configurePdfWorker,
  ExpenseRequestPdfError,
  extractTextFromExpenseRequestPdf,
  type PdfLoader,
  parseTopDownExpenseRequestText,
} from "./expense-request-pdf";
import { applyExtractionToFormValues, getDefaultProcessCreationFormValues } from "./processes";

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

const representativeTopDownSdText = `
PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000
CNPJ: 08.290.223/0001-42
Solicitação de
Despesa
MUNICIPIO DE PUREZA
Sistema Orçamentário, Financeiro e Contábil   Pág.: 1/1
Unidade Orcamentária:   06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer
Nº Solicitação:
6
Data Emissão:
08/01/2026   10/2026
Processo:
Serviço
Classificação:
Contratação de apresentação artística musical da banda FORRÓ TSUNAMI, para abrilhantar as festividades do Carnaval de
Pureza 2026, que será realizado de 13 a 17 de fevereiro.
Objeto:
O Município de Pureza/RN realizará, no período de 13 a 17 de fevereiro de 2026, o Carnaval de Pureza 2026.
A programação carnavalesca tem como finalidade promover o acesso à cultura e fomentar a economia do município.
Justificativa:
Item   Descrição   Qtd.   Und   Vlr. Unitário   Vlr. Total Lote   Fator Qtd.Ini
apresentação artística musical da banda
FORRÓ TSUNAMI, para abrilhantar as
festividades do Carnaval de Pureza 2026, que
será realizado de 13 a 17 de fevereiro, com
duração de 02 horas de show.
0005091   1   0,00   0,00 SERVIÇO
0,00 Valor Total:
SECRETÁRIO DE EDUCAÇÃO, CULTURA, ESPORTE E LAZER
MARIA MARILDA SILVA DA ROCHA
878.541.554-53
SECRETÁRIO DE EDUCAÇÃO, CULTURA, ESPORTE E LAZER
`;

function createPdfFile(name = "SD.pdf", type = "application/pdf", content = "pdf") {
  return new File([content], name, { type });
}

function createLoader(text: string): PdfLoader {
  return () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: text.split("\n").map((line) => ({ str: line, hasEOL: true })),
        }),
      }),
    }),
  });
}

describe("expense request PDF helpers", () => {
  it("configures the bundled pdfjs worker before default document loading", () => {
    const pdfjs = {
      GlobalWorkerOptions: {
        workerSrc: "",
      },
    };

    configurePdfWorker(pdfjs);

    expect(pdfjs.GlobalWorkerOptions.workerSrc).toContain("pdf.worker");
  });

  it("extracts text from a readable PDF through an injected loader", async () => {
    await expect(
      extractTextFromExpenseRequestPdf(createPdfFile(), createLoader(expenseRequestText)),
    ).resolves.toContain("Solicitacao de Despesa");
  });

  it("rejects invalid and unreadable PDF files", async () => {
    await expect(
      extractTextFromExpenseRequestPdf(createPdfFile("SD.txt", "text/plain"), createLoader("")),
    ).rejects.toThrow(ExpenseRequestPdfError);
    await expect(
      extractTextFromExpenseRequestPdf(
        createPdfFile("SD.pdf", "application/pdf", ""),
        createLoader(""),
      ),
    ).rejects.toThrow("vazio");
    await expect(
      extractTextFromExpenseRequestPdf(createPdfFile(), createLoader("   ")),
    ).rejects.toThrow("texto selecionavel");
  });

  it("parses TopDown text into editable process suggestions", () => {
    const extraction = parseTopDownExpenseRequestText(expenseRequestText, "SD.pdf");

    expect(extraction.suggestions).toMatchObject({
      type: "Servico",
      processNumber: "SD-6-2026",
      externalId: "6",
      issuedAt: "2026-01-08",
      object: "Contratacao de apresentacao artistica musical",
      justification: "Justificativa da necessidade.",
      responsibleName: "Maria Responsavel",
      sourceKind: "expense_request",
      sourceReference: "SD-6-2026",
    });
    expect(extraction.extractedFields.budgetUnitCode).toBe("06.001");
    expect(extraction.extractedFields.item).toMatchObject({
      code: "12345",
      quantity: "1",
      unit: "UND",
      unitValue: "10.000,00",
      totalValue: "10.000,00",
    });
    expect(extraction.warnings).toEqual([]);
  });

  it("parses the representative real TopDown SD text like the backend", () => {
    const extraction = parseTopDownExpenseRequestText(representativeTopDownSdText, "SD.pdf");

    expect(extraction.suggestions).toMatchObject({
      type: "Serviço",
      processNumber: "SD-6-2026",
      externalId: "6",
      issuedAt: "2026-01-08",
      sourceKind: "expense_request",
      sourceReference: "SD-6-2026",
    });
    expect(extraction.extractedFields).toMatchObject({
      budgetUnitCode: "06.001",
      budgetUnitName: "Sec.Mun.de Educ,Cultura, Esporte e Lazer",
      issueDate: "2026-01-08",
      organizationCnpj: "08.290.223/0001-42",
      organizationName: "MUNICIPIO DE PUREZA",
      processType: "Serviço",
      requestNumber: "6",
      responsibleName: "MARIA MARILDA SILVA DA ROCHA",
      responsibleRole: "SECRETÁRIO DE EDUCAÇÃO, CULTURA, ESPORTE E LAZER",
    });
    expect(extraction.extractedFields.object).toContain("FORRÓ TSUNAMI");
    expect(extraction.extractedFields.item).toMatchObject({
      code: "0005091",
      quantity: "1",
      unit: "SERVIÇO",
      unitValue: "0,00",
      totalValue: "0,00",
    });
    expect(extraction.suggestions.justification).toContain("Carnaval de Pureza 2026");
  });

  it("keeps missing optional values as warnings instead of inventing data", () => {
    const extraction = parseTopDownExpenseRequestText(
      `
      Solicitacao de Despesa
      Unidade Orcamentaria: 06.001 - Secretaria de Educacao
      N Solicitacao: 9
      Data Emissao: 09/01/2026
      Processo: Servico
      Classificacao: Compra direta
      Objeto: Necessidade descrita
      `,
      "SD.pdf",
    );

    expect(extraction.warnings).toContain("organization_cnpj_missing");
    expect(extraction.warnings).toContain("responsible_name_missing");
    expect(extraction.suggestions.processNumber).toBe("SD-9-2026");
  });

  it("classifies readable PDFs that are not valid SDs", () => {
    expect(() =>
      parseTopDownExpenseRequestText("Relatorio sem marcadores", "relatorio.pdf"),
    ).toThrow(ExpenseRequestPdfError);

    expect(() =>
      parseTopDownExpenseRequestText(
        `
        Solicitacao de Despesa
        Unidade Orcamentaria: 06.001 - Secretaria de Educacao
        Processo: Servico
        `,
        "SD.pdf",
      ),
    ).toThrow("campos obrigatorios");
  });

  it("replaces previous PDF suggestions while preserving dirty user edits", () => {
    const currentValues = {
      ...getDefaultProcessCreationFormValues({
        role: "member",
        organizationId: "organization-1",
      }),
      object: "Objeto editado",
    };
    const firstExtraction = parseTopDownExpenseRequestText(expenseRequestText, "SD-1.pdf");
    const secondExtraction = parseTopDownExpenseRequestText(
      expenseRequestText.replace("N Solicitacao:\n6", "N Solicitacao:\n7"),
      "SD-2.pdf",
    );

    const firstValues = applyExtractionToFormValues(currentValues, firstExtraction, {
      object: true,
    });
    const secondValues = applyExtractionToFormValues(firstValues, secondExtraction, {
      object: true,
    });

    expect(secondValues.processNumber).toBe("SD-7-2026");
    expect(secondValues.object).toBe("Objeto editado");
  });
});
