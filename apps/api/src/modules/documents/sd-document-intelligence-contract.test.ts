import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "vitest";
import {
  assertSdDocumentIntelligenceContractMetadataCurrent,
  createSha256Digest,
  loadSdDocumentIntelligenceContract,
  parseSdDocumentIntelligenceContract,
  SD_DOCUMENT_INTELLIGENCE_CONTRACT_DIGEST,
  SD_DOCUMENT_INTELLIGENCE_SOURCE_DIGEST,
  SD_DOCUMENT_INTELLIGENCE_SOURCE_PATH,
} from "./sd-document-intelligence-contract";

function readWorkspaceFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), "../..", relativePath), "utf8");
}

test("runtime sd-document-intelligence contract mirrors the Codex skill source", () => {
  const sourceMarkdown = readWorkspaceFile(SD_DOCUMENT_INTELLIGENCE_SOURCE_PATH);
  const contractMarkdown = readFileSync(
    resolve(process.cwd(), "src/modules/documents/recipes/sd-document-intelligence.contract.md"),
    "utf8",
  );
  const contract = loadSdDocumentIntelligenceContract();

  assert.equal(sourceMarkdown, contractMarkdown);
  assert.equal(createSha256Digest(sourceMarkdown), SD_DOCUMENT_INTELLIGENCE_SOURCE_DIGEST);
  assert.equal(createSha256Digest(contractMarkdown), SD_DOCUMENT_INTELLIGENCE_CONTRACT_DIGEST);
  assert.equal(contract.metadata.name, "sd-document-intelligence");
  assert.equal(contract.metadata.sourceDigest, contract.metadata.contractDigest);
  assert.deepEqual(contract.metadata.stageOrder, [
    "extract_facts",
    "classify_semantically",
    "enrich_context",
    "plan_document",
    "write_document",
    "humanize_document",
    "review_document",
    "rewrite_final",
  ]);
  assert.ok(contract.metadata.classificationFields.includes("procurementType"));
  assert.match(contract.promptBlock, /Nenhuma inferência antes da classificação semântica/);
  assert.match(contract.promptBlock, /Minuta.*contratual.*placeholders/is);
});

test("runtime sd-document-intelligence contract fails closed when stale or incomplete", () => {
  const sourceMarkdown = readWorkspaceFile(SD_DOCUMENT_INTELLIGENCE_SOURCE_PATH);

  assert.throws(
    () =>
      parseSdDocumentIntelligenceContract(
        sourceMarkdown.replace("Nenhuma inferência", "Inferência"),
      ),
    /digest does not match/i,
  );
  assert.doesNotThrow(() =>
    assertSdDocumentIntelligenceContractMetadataCurrent(
      parseSdDocumentIntelligenceContract(sourceMarkdown).metadata,
    ),
  );
  assert.throws(
    () =>
      assertSdDocumentIntelligenceContractMetadataCurrent({
        ...parseSdDocumentIntelligenceContract(sourceMarkdown).metadata,
        contractDigest: "stale",
      }),
    /stale or invalid/i,
  );
});
