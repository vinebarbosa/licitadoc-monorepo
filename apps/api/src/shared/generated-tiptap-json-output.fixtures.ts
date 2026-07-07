import type { GeneratedDocumentType } from "./text-generation/types";
import type { TiptapDocumentJson } from "./tiptap-json";

function textNode(text: string, marks?: Array<{ type: "bold" | "italic" | "strike" | "code" }>) {
  return marks?.length ? { type: "text", marks, text } : { type: "text", text };
}

function paragraph(text: string, attrs?: Record<string, unknown>) {
  return {
    type: "paragraph",
    ...(attrs ? { attrs } : {}),
    content: [textNode(text)],
  };
}

function heading(level: 1 | 2 | 3, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [textNode(text)],
  };
}

function signatureBlocks() {
  return [
    paragraph("Fortaleza/CE, 25 de maio de 2026.", {
      noFirstLineIndent: true,
      signatureClosingPart: "date",
      textAlign: "right",
    }),
    paragraph("Responsavel pela demanda", {
      noFirstLineIndent: true,
      signatureClosingPart: "name",
      textAlign: "center",
    }),
    paragraph("Unidade requisitante", {
      noFirstLineIndent: true,
      signatureClosingPart: "role",
      textAlign: "center",
    }),
  ];
}

export const validGeneratedTiptapDfdFixture: TiptapDocumentJson = {
  type: "doc",
  content: [
    heading(1, "DOCUMENTO DE FORMALIZACAO DE DEMANDA"),
    heading(2, "1. DADOS DA SOLICITACAO"),
    paragraph("Processo: SD-6-2026"),
    heading(2, "2. OBJETO DA CONTRATACAO"),
    paragraph("Contratacao de servicos continuados de apoio administrativo."),
    heading(2, "3. JUSTIFICATIVA DA NECESSIDADE"),
    paragraph("A demanda preserva a continuidade das atividades administrativas essenciais."),
    ...signatureBlocks(),
  ],
};

export const validGeneratedTiptapEtpFixture: TiptapDocumentJson = {
  type: "doc",
  content: [
    heading(1, "ESTUDO TECNICO PRELIMINAR"),
    heading(2, "1. DESCRICAO DA NECESSIDADE"),
    paragraph(
      "A administracao necessita organizar contratacao compativel com a demanda registrada.",
    ),
    heading(2, "2. REQUISITOS DA CONTRATACAO"),
    paragraph("Os requisitos deverao preservar adequacao tecnica e controle administrativo."),
    ...signatureBlocks(),
  ],
};

export const validGeneratedTiptapTrFixture: TiptapDocumentJson = {
  type: "doc",
  content: [
    heading(1, "TERMO DE REFERENCIA"),
    heading(2, "1. OBJETO"),
    paragraph("Contratacao de servicos continuados de apoio administrativo."),
    heading(2, "2. CONDICOES DE EXECUCAO"),
    paragraph("A execucao observara as condicoes estabelecidas pela unidade requisitante."),
    ...signatureBlocks(),
  ],
};

export const validGeneratedTiptapMinutaFixture: TiptapDocumentJson = {
  type: "doc",
  content: [
    heading(1, "MINUTA DE CONTRATO"),
    heading(2, "CLAUSULA PRIMEIRA - DO OBJETO"),
    paragraph(
      "O presente contrato tem por objeto a contratacao descrita no processo administrativo.",
    ),
    heading(2, "CLAUSULA SEGUNDA - DA EXECUCAO"),
    paragraph("A execucao ocorrera conforme as condicoes estabelecidas no termo de referencia."),
  ],
};

export const validGeneratedTiptapFixturesByType: Record<GeneratedDocumentType, TiptapDocumentJson> =
  {
    dfd: validGeneratedTiptapDfdFixture,
    etp: validGeneratedTiptapEtpFixture,
    minuta: validGeneratedTiptapMinutaFixture,
    tr: validGeneratedTiptapTrFixture,
  };

export const invalidGeneratedTiptapHtmlFixture: TiptapDocumentJson = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [textNode("<script>alert('x')</script>")],
    },
  ],
};

export const invalidGeneratedTiptapWrongFamilyFixture: TiptapDocumentJson = {
  type: "doc",
  content: [
    heading(1, "DOCUMENTO DE FORMALIZACAO DE DEMANDA"),
    heading(2, "ESTUDO TECNICO PRELIMINAR"),
    paragraph("Esta secao nao pertence ao DFD."),
  ],
};
