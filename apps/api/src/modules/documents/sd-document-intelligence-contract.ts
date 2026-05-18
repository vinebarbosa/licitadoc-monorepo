import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SD_DOCUMENT_INTELLIGENCE_CONTRACT_NAME = "sd-document-intelligence";
export const SD_DOCUMENT_INTELLIGENCE_CONTRACT_VERSION = "2026-05-18.1";
export const SD_DOCUMENT_INTELLIGENCE_SOURCE_PATH =
  ".codex/skills/sd-document-intelligence/SKILL.md";
export const SD_DOCUMENT_INTELLIGENCE_SOURCE_DIGEST =
  "ccfaf0ad4c2232ea65aa992734b3b5a8d2d78fd918550c4ffe0474990f312f6c";
export const SD_DOCUMENT_INTELLIGENCE_CONTRACT_DIGEST =
  "ccfaf0ad4c2232ea65aa992734b3b5a8d2d78fd918550c4ffe0474990f312f6c";

const CONTRACT_ASSET_FILE_NAME = "sd-document-intelligence.contract.md";

export const SD_DOCUMENT_INTELLIGENCE_STAGE_ORDER = [
  "extract_facts",
  "classify_semantically",
  "enrich_context",
  "plan_document",
  "write_document",
  "humanize_document",
  "review_document",
  "rewrite_final",
] as const;

export const SD_DOCUMENT_INTELLIGENCE_CLASSIFICATION_FIELDS = [
  "procurementType",
  "operationalNature",
  "executionComplexity",
  "publicInterestProfile",
  "probableLegalPath",
  "confidence",
  "reasoning",
] as const;

export const SD_DOCUMENT_INTELLIGENCE_DOCUMENT_ROLES = {
  DFD: "curto, formalização inicial, sem estudo de mercado, sem riscos detalhados e sem análise profunda",
  ETP: "analítico, proporcional à complexidade, com alternativas, riscos, estimativa, sustentabilidade quando compatível e gestão/fiscalização",
  MINUTA:
    "contratual, com placeholders, cláusulas fixas, linguagem jurídica, sem parecer e sem análise de viabilidade",
  TR: "operacional, com especificações, execução, recebimento, obrigações, fiscalização, pagamento e aceite",
} as const;

const REQUIRED_CONTRACT_SNIPPETS = [
  "Nenhuma inferência antes da classificação semântica.",
  "Fatos extraídos",
  "Inferências contextualizadas",
  "Pendências",
  "Trate valores `0`, `0,00`, `0.00` ou `R$ 0,00` como ausência de estimativa válida, não como preço.",
  "Use o Semantic Procurement Classifier antes de qualquer inferência:",
  "Defina `probableLegalPath` como `undefined` quando a SD não trouxer dado suficiente.",
  "Se a SD de distribuição gratuita não informar público-alvo, registre público e critério de distribuição como pendências; não invente beneficiários.",
  "**DFD**: curto, formalização inicial, sem estudo de mercado, sem riscos detalhados e sem análise profunda.",
  "**ETP**: analítico, proporcional à complexidade, com alternativas, riscos, estimativa, sustentabilidade quando compatível e gestão/fiscalização.",
  "**TR**: operacional, com especificações, execução, recebimento, obrigações, fiscalização, pagamento e aceite.",
  "**Minuta**: contratual, com placeholders, cláusulas fixas, linguagem jurídica, sem parecer e sem análise de viabilidade.",
  "afirmar pesquisa de preços, economicidade, dotação, modalidade ou disponibilidade orçamentária sem evidência",
] as const;

export class SdDocumentIntelligenceContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SdDocumentIntelligenceContractError";
  }
}

export type SdDocumentIntelligenceContractMetadata = {
  classificationFields: string[];
  contractDigest: string;
  documentRoles: {
    DFD: string;
    ETP: string;
    MINUTA: string;
    TR: string;
  };
  name: typeof SD_DOCUMENT_INTELLIGENCE_CONTRACT_NAME;
  sourceDigest: string;
  sourcePath: string;
  stageOrder: string[];
  version: string;
};

export type SdDocumentIntelligenceContract = {
  markdown: string;
  metadata: SdDocumentIntelligenceContractMetadata;
  promptBlock: string;
};

export function createSha256Digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function getContractAssetPaths() {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));

  return [
    resolve(moduleDirectory, "recipes", CONTRACT_ASSET_FILE_NAME),
    resolve(process.cwd(), "dist/modules/documents/recipes", CONTRACT_ASSET_FILE_NAME),
    resolve(process.cwd(), "src/modules/documents/recipes", CONTRACT_ASSET_FILE_NAME),
    resolve(process.cwd(), "apps/api/dist/modules/documents/recipes", CONTRACT_ASSET_FILE_NAME),
    resolve(process.cwd(), "apps/api/src/modules/documents/recipes", CONTRACT_ASSET_FILE_NAME),
  ];
}

function readContractAsset() {
  for (const assetPath of getContractAssetPaths()) {
    if (existsSync(assetPath)) {
      return readFileSync(assetPath, "utf8");
    }
  }

  throw new SdDocumentIntelligenceContractError(
    `Runtime SD document intelligence contract asset not found: ${CONTRACT_ASSET_FILE_NAME}.`,
  );
}

function validateRequiredSnippets(markdown: string) {
  const missing = REQUIRED_CONTRACT_SNIPPETS.filter((snippet) => !markdown.includes(snippet));

  if (missing.length > 0) {
    throw new SdDocumentIntelligenceContractError(
      `Runtime SD document intelligence contract is missing required skill rules: ${missing.join(
        "; ",
      )}.`,
    );
  }
}

export function getSdDocumentIntelligenceContractMetadata(
  contractDigest = SD_DOCUMENT_INTELLIGENCE_CONTRACT_DIGEST,
): SdDocumentIntelligenceContractMetadata {
  return {
    classificationFields: [...SD_DOCUMENT_INTELLIGENCE_CLASSIFICATION_FIELDS],
    contractDigest,
    documentRoles: SD_DOCUMENT_INTELLIGENCE_DOCUMENT_ROLES,
    name: SD_DOCUMENT_INTELLIGENCE_CONTRACT_NAME,
    sourceDigest: SD_DOCUMENT_INTELLIGENCE_SOURCE_DIGEST,
    sourcePath: SD_DOCUMENT_INTELLIGENCE_SOURCE_PATH,
    stageOrder: [...SD_DOCUMENT_INTELLIGENCE_STAGE_ORDER],
    version: SD_DOCUMENT_INTELLIGENCE_CONTRACT_VERSION,
  };
}

export function parseSdDocumentIntelligenceContract(markdown: string) {
  const contractDigest = createSha256Digest(markdown);

  if (contractDigest !== SD_DOCUMENT_INTELLIGENCE_CONTRACT_DIGEST) {
    throw new SdDocumentIntelligenceContractError(
      "Runtime SD document intelligence contract digest does not match the synchronized Codex skill digest.",
    );
  }

  validateRequiredSnippets(markdown);

  const metadata = getSdDocumentIntelligenceContractMetadata(contractDigest);

  return {
    markdown,
    metadata,
    promptBlock: formatSdDocumentIntelligenceContractForPrompt({
      markdown,
      metadata,
    }),
  };
}

export function loadSdDocumentIntelligenceContract(): SdDocumentIntelligenceContract {
  return parseSdDocumentIntelligenceContract(readContractAsset());
}

export function assertSdDocumentIntelligenceContractMetadataCurrent(
  metadata: SdDocumentIntelligenceContractMetadata,
) {
  if (
    metadata.name !== SD_DOCUMENT_INTELLIGENCE_CONTRACT_NAME ||
    metadata.version !== SD_DOCUMENT_INTELLIGENCE_CONTRACT_VERSION ||
    metadata.sourceDigest !== SD_DOCUMENT_INTELLIGENCE_SOURCE_DIGEST ||
    metadata.contractDigest !== SD_DOCUMENT_INTELLIGENCE_CONTRACT_DIGEST
  ) {
    throw new SdDocumentIntelligenceContractError(
      "Persisted SD document intelligence contract metadata is stale or invalid.",
    );
  }
}

export function formatSdDocumentIntelligenceContractForPrompt({
  markdown,
  metadata,
}: {
  markdown: string;
  metadata: SdDocumentIntelligenceContractMetadata;
}) {
  return [
    "## Contrato runtime obrigatório: sd-document-intelligence",
    `- Nome: ${metadata.name}`,
    `- Versão: ${metadata.version}`,
    `- Digest da skill-fonte: ${metadata.sourceDigest}`,
    `- Digest do contrato runtime: ${metadata.contractDigest}`,
    `- Ordem obrigatória: ${metadata.stageOrder.join(" -> ")}`,
    "",
    "A geração documental deve seguir estritamente a skill abaixo. Ela é a fonte normativa de classificação, enriquecimento, planejamento, anti-alucinação, valor zerado, pendências, riscos, alternativas e limites documentais.",
    "",
    "```markdown",
    markdown,
    "```",
  ].join("\n");
}
