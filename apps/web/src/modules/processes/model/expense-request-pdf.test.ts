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

const multiItemKitSchoolText = `
PRACA 05 DE ABRIL, 180, CENTRO
CNPJ: 08.290.223/0001-42
Solicitacao de Despesa
MUNICIPIO DE PUREZA
Unidade Orcamentaria: 06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer
N Solicitacao:
22
Data Emissao:
10/05/2026
Processo:
Pregao
Classificacao:
Aquisicao de kits escolares
Objeto:
Distribuicao de materiais escolares aos alunos da rede municipal.
Justificativa:
Necessidade de fornecimento de materiais escolares para o ano letivo.
Item Descricao Qtd. Und Vlr. Unitario Vlr. Total
KIT ESCOLAR: EDUCACAO INFANTIL 1 CADERNO BROCHURA: DESCRICAO caderno brochura capa dura
2 LAPIS GRAFITE: DESCRICAO lapis preto escolar
0005113 550 0,00 0,00 KIT
Sistema Orcamentario, Financeiro e Contabil Pag.: 2/3
KIT ESCOLAR: ENSINO FUNDAMENTAL I 1 CADERNO UNIVERSITARIO: DESCRICAO caderno universitario 96 folhas
1 BORRACHA BRANCA: DESCRICAO borracha escolar
0005114 300 0,00 0,00 KIT
KIT ESCOLAR: ENSINO FUNDAMENTAL II 1 CANETA AZUL: DESCRICAO caneta esferografica azul
1 TESOURA ESCOLAR: DESCRICAO tesoura sem ponta
0005115 470 0,00 0,00 KIT
Valor Total
0,00
SECRETARIO DE EDUCACAO
MARIA RESPONSAVEL
123.456.789-00
`;

const mothersDayMultiItemText = `
PRACA 05 DE ABRIL, 180, CENTRO, PUREZA/RN CEP: 59582000
CNPJ: 08.290.223/0001-42
Solicitação de
Despesa
MUNICIPIO DE PUREZA
Unidade Orcamentária:   06.001 - Sec.Mun.de Educ,Cultura, Esporte e Lazer
Nº Solicitação:
53
Data Emissão:
30/04/2026   825/2026
Processo:
Compra
Classificação:
Contratação de empresa para aquisição de materiais para distribuição gratuita em comemoração ao dia das mães na
cidade de Pureza/RN.
Objeto:
A contratação direta por dispensa de licitação mostra-se tecnicamente adequada.
Justificativa:
Item   Descrição   Qtd.   Und   Vlr. Unitário   Vlr. Total Lote   Fator Qtd.Ini
Pote plástico (de no mínimo 1L) com tampa e
trava lateral, de material reutilizável.
0005909   550   0,00   0,00 UN
Kit com 2 (duas) unidades de potes plásticos
(de no mínimo 1L) com tampa e trava lateral,
de material reutilizável.
0005910   550   0,00   0,00 KIT
Kit com 3 (três) unidades de potes plásticos
(de no mínimo 1L) com tampa e trava lateral,
de material reutilizável
0005911   550   0,00   0,00 KIT
Embalagem para presente, adequada ao
acondicionamento de potes plásticos
individuais ou kits contendo até 3 (três)
unidades, com capacidade mínima de 1 litro
cada.
0005912   6   0,00   0,00 ROLO
Fita adesiva transparente tipo durex,
contendo rolos de dimensões padrão, indicada
para uso geral em escritório. Pacote contendo 10
unidades em cada.
0005913   5   0,00   0,00 PACOTE
0,00 Valor Total:
SECRETÁRIO DE EDUCAÇÃO, CULTURA, ESPORTE E LAZER
MARIA MARILDA SILVA DA ROCHA
878.541.554-53
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

  it("parses multi-item TopDown text into reviewed item rows", () => {
    const extraction = parseTopDownExpenseRequestText(multiItemKitSchoolText, "SD-kit.pdf");

    expect(extraction.extractedFields).not.toHaveProperty("itemStructureDiagnostics");
    expect(extraction.extractedFields.items).toHaveLength(3);
    expect(extraction.extractedFields.item).toMatchObject({
      code: "0005113",
      quantity: "550",
      unit: "KIT",
    });
    expect(extraction.suggestions.expenseRequestItems).toHaveLength(3);
  });

  it("parses the SD Dias das Maes item table pattern", () => {
    const extraction = parseTopDownExpenseRequestText(mothersDayMultiItemText, "SD-maes.pdf");

    expect(extraction.extractedFields.items).toHaveLength(5);
    expect(extraction.extractedFields.items?.[0]).toMatchObject({
      code: "0005909",
      description: expect.stringContaining("Pote plástico"),
      quantity: "550",
      unit: "UN",
      unitValue: "0,00",
      totalValue: "0,00",
    });
    expect(extraction.extractedFields.items?.[4]).toMatchObject({
      code: "0005913",
      description: expect.stringContaining("Fita adesiva"),
      quantity: "5",
      unit: "PACOTE",
    });
    expect(extraction.extractedFields.item).toMatchObject({
      code: "0005909",
      quantity: "550",
      unit: "UN",
    });
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
