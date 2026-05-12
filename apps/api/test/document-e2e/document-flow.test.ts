import assert from "node:assert/strict";
import { afterAll, afterEach, beforeAll, beforeEach, describe, test } from "vitest";
import { documents } from "../../src/db";
import {
  getDocumentContentHash,
  resolveDocumentTextAdjustmentTarget,
} from "../../src/modules/documents/document-text-adjustment";
import { createOrganizationOwnerActor } from "../e2e/helpers/actors";
import {
  cleanupApiE2EState,
  createDepartmentFixture,
  createProcessFixture,
  getDocumentById,
} from "../e2e/helpers/fixtures";
import { readJson, request } from "../e2e/helpers/http";
import {
  API_E2E_TEST_DEPARTMENT_SLUGS,
  API_E2E_TEST_EMAILS,
  API_E2E_TEST_ORGANIZATION_SLUGS,
} from "../e2e/helpers/known-fixtures";
import {
  type ApiTestServer,
  getListeningOrigin,
  startTestServer,
} from "../e2e/helpers/test-server";

type DocumentResponse = {
  createdAt: string;
  draftContent: string | null;
  id: string;
  name: string;
  organizationId: string;
  processId: string;
  responsibles: string[];
  status: string;
  storageKey: string | null;
  type: string;
  updatedAt: string;
};

type DocumentsListResponse = {
  items: Array<Omit<DocumentResponse, "draftContent" | "responsibles" | "storageKey">>;
};

const OWNER_EMAIL = "document-e2e-owner@licitadoc.test";
const OTHER_OWNER_EMAIL = "document-e2e-other-owner@licitadoc.test";
const OWNER_ORG_SLUG = "document-e2e-owner-org";
const OTHER_ORG_SLUG = "document-e2e-other-org";
const OWNER_DEPARTMENT_SLUG = "document-e2e-owner-dept";
const OTHER_DEPARTMENT_SLUG = "document-e2e-other-dept";

let server: ApiTestServer;

beforeAll(async () => {
  server = await startTestServer();
  assert.equal(getListeningOrigin(server.app), server.baseUrl);
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

beforeEach(async () => {
  await cleanupApiE2EState(server.app.db, {
    departmentSlugs: [...API_E2E_TEST_DEPARTMENT_SLUGS],
    emails: [...API_E2E_TEST_EMAILS],
    organizationSlugs: [...API_E2E_TEST_ORGANIZATION_SLUGS],
  });
});

async function createScopedProcessFixture() {
  const owner = await createOrganizationOwnerActor(server, {
    email: OWNER_EMAIL,
    name: "Document Owner",
    organization: {
      cnpj: "95100000000001",
      name: "Document Owner Org",
      slug: OWNER_ORG_SLUG,
    },
  });
  const department = await createDepartmentFixture(server.app.db, {
    name: "Document Owner Dept",
    organizationId: owner.organization.id,
    slug: OWNER_DEPARTMENT_SLUG,
  });
  const process = await createProcessFixture(server.app.db, {
    departmentIds: [department.id],
    organizationId: owner.organization.id,
    processNumber: "DOC-2026-001",
  });

  return {
    owner,
    department,
    process,
  };
}

describe("document generation E2E coverage", () => {
  test("organization owners generate, read, and list completed document drafts", async () => {
    const { owner, process } = await createScopedProcessFixture();

    const createResponse = await request(server, "/api/documents/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        processId: process.id,
        documentType: "dfd",
        instructions: "Use linguagem direta.",
      },
    });
    const createBody = await readJson<DocumentResponse>(createResponse);

    assert.equal(createResponse.status, 201);
    assert.ok(createBody);
    assert.equal(createBody.processId, process.id);
    assert.equal(createBody.organizationId, owner.organization.id);
    assert.equal(createBody.type, "dfd");
    assert.equal(createBody.status, "completed");
    assert.ok(createBody.draftContent?.includes("Documento DFD"));

    const persistedDocument = await getDocumentById(server.app.db, createBody.id);

    assert.ok(persistedDocument);
    assert.equal(persistedDocument.type, "dfd");
    assert.equal(persistedDocument.status, "completed");
    assert.equal(persistedDocument.processId, process.id);

    const detailResponse = await request(server, `/api/documents/${createBody.id}`, {
      cookieJar: owner.cookieJar,
    });
    const detailBody = await readJson<DocumentResponse>(detailResponse);

    assert.equal(detailResponse.status, 200);
    assert.equal(detailBody?.draftContent, createBody.draftContent);

    const listResponse = await request(server, "/api/documents/", {
      cookieJar: owner.cookieJar,
    });
    const listBody = await readJson<DocumentsListResponse>(listResponse);

    assert.equal(listResponse.status, 200);
    assert.ok(listBody?.items.some((item) => item.id === createBody.id));
  });

  test("organization-scoped actors cannot generate or read outside their organization", async () => {
    const { owner, process } = await createScopedProcessFixture();
    const otherOwner = await createOrganizationOwnerActor(server, {
      email: OTHER_OWNER_EMAIL,
      name: "Document Other Owner",
      organization: {
        cnpj: "95100000000002",
        name: "Document Other Org",
        slug: OTHER_ORG_SLUG,
      },
    });
    await createDepartmentFixture(server.app.db, {
      name: "Document Other Dept",
      organizationId: otherOwner.organization.id,
      slug: OTHER_DEPARTMENT_SLUG,
    });

    const createResponse = await request(server, "/api/documents/", {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        processId: process.id,
        documentType: "tr",
      },
    });
    const createBody = await readJson<DocumentResponse>(createResponse);

    assert.equal(createResponse.status, 201);

    const foreignGenerateResponse = await request(server, "/api/documents/", {
      method: "POST",
      cookieJar: otherOwner.cookieJar,
      body: {
        processId: process.id,
        documentType: "tr",
      },
    });

    assert.equal(foreignGenerateResponse.status, 403);

    const foreignReadResponse = await request(server, `/api/documents/${createBody?.id}`, {
      cookieJar: otherOwner.cookieJar,
    });

    assert.equal(foreignReadResponse.status, 403);
  });

  test("provider failures return a failed persisted document", async () => {
    const { owner, process } = await createScopedProcessFixture();
    const previousProvider = server.app.textGeneration;

    server.app.textGeneration = {
      providerKey: "stub",
      model: "failing-stub",
      async generateText() {
        throw new Error("Provider is unavailable.");
      },
    };

    try {
      const createResponse = await request(server, "/api/documents/", {
        method: "POST",
        cookieJar: owner.cookieJar,
        body: {
          processId: process.id,
          documentType: "minuta",
        },
      });
      const createBody = await readJson<DocumentResponse>(createResponse);

      assert.equal(createResponse.status, 201);
      assert.ok(createBody);
      assert.equal(createBody.status, "failed");
      assert.equal(createBody.draftContent, null);

      const persistedDocument = await getDocumentById(server.app.db, createBody.id);

      assert.ok(persistedDocument);
      assert.equal(persistedDocument.status, "failed");
    } finally {
      server.app.textGeneration = previousProvider;
    }
  });
});

describe("document text adjustment E2E coverage", () => {
  const PARA_DRAFT_CONTENT = `# DOCUMENTO DE FORMALIZACAO DE DEMANDA

## 1. Objeto

Contratacao de servicos de TI para suporte tecnico especializado.

## 2. Justificativa

A contratacao se faz necessaria para atender a demanda apresentada.`;

  const LIST_DRAFT_CONTENT = `# DOCUMENTO DE FORMALIZACAO DE DEMANDA

## 1. DADOS

- Unidade: Secretaria Municipal de Administracao
- Objeto: Contratacao de servicos de consultoria especializada
- Responsavel: Maria Costa`;
  let previousTextGenerationProvider: typeof server.app.textGeneration;

  beforeEach(() => {
    previousTextGenerationProvider = server.app.textGeneration;
    server.app.textGeneration = {
      providerKey: "stub",
      model: "adjustment-e2e-stub",
      async generateText(input) {
        return {
          providerKey: "stub",
          model: "adjustment-e2e-stub",
          text: `Texto ajustado para ${input.documentType.toUpperCase()}.`,
          responseMetadata: {
            finishReason: "stop",
          },
        };
      },
    };
  });

  afterEach(() => {
    server.app.textGeneration = previousTextGenerationProvider;
  });

  async function createScopedProcessFixture() {
    const owner = await createOrganizationOwnerActor(server, {
      email: OWNER_EMAIL,
      name: "Adjustment Owner",
      organization: {
        cnpj: "95100000000001",
        name: "Adjustment Owner Org",
        slug: OWNER_ORG_SLUG,
      },
    });
    const department = await createDepartmentFixture(server.app.db, {
      name: "Adjustment Owner Dept",
      organizationId: owner.organization.id,
      slug: OWNER_DEPARTMENT_SLUG,
    });
    const process = await createProcessFixture(server.app.db, {
      departmentIds: [department.id],
      organizationId: owner.organization.id,
      processNumber: "ADJ-2026-001",
    });

    return { owner, process };
  }

  async function insertCompletedDocument(
    organizationId: string,
    processId: string,
    draftContent: string,
  ) {
    const [doc] = await server.app.db
      .insert(documents)
      .values({
        organizationId,
        processId,
        name: "DFD - ADJ-2026-001",
        type: "dfd",
        status: "completed",
        storageKey: null,
        draftContent,
        responsibles: ["Maria Costa"],
      })
      .returning();

    assert.ok(doc, "Expected inserted document to be returned.");
    return doc;
  }

  test("4.1 successful paragraph selection apply uses the resolved source target", async () => {
    const { owner, process } = await createScopedProcessFixture();
    const doc = await insertCompletedDocument(
      owner.organization.id,
      process.id,
      PARA_DRAFT_CONTENT,
    );

    const selectedText = "Contratacao de servicos de TI para suporte tecnico especializado.";
    const expectedStart = PARA_DRAFT_CONTENT.indexOf(selectedText);
    assert.ok(expectedStart >= 0, "selectedText should exist in draft");

    const suggestResponse = await request(
      server,
      `/api/documents/${doc.id}/adjustments/suggestions`,
      {
        method: "POST",
        cookieJar: owner.cookieJar,
        body: {
          selectedText,
          instruction: "Deixe mais objetivo.",
        },
      },
    );
    const suggestion = await readJson<{
      selectedText: string;
      replacementText: string;
      sourceContentHash: string;
      sourceTarget: { start: number; end: number; sourceText: string };
    }>(suggestResponse);

    assert.equal(suggestResponse.status, 200);
    assert.ok(suggestion);
    assert.equal(suggestion.sourceTarget.start, expectedStart);
    assert.equal(suggestion.sourceTarget.end, expectedStart + selectedText.length);
    assert.equal(suggestion.sourceTarget.sourceText, selectedText);
    assert.equal(suggestion.sourceContentHash, getDocumentContentHash(PARA_DRAFT_CONTENT));

    const applyResponse = await request(server, `/api/documents/${doc.id}/adjustments/apply`, {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        sourceTarget: suggestion.sourceTarget,
        replacementText: suggestion.replacementText,
        sourceContentHash: suggestion.sourceContentHash,
      },
    });
    const applied = await readJson<DocumentResponse>(applyResponse);

    assert.equal(applyResponse.status, 200);
    assert.ok(applied);
    assert.ok(applied.draftContent?.includes(suggestion.replacementText));

    const persisted = await getDocumentById(server.app.db, doc.id);
    assert.ok(persisted?.draftContent?.includes(suggestion.replacementText));
  });

  test("4.2 rendered list-field selection without markdown markers maps to correct source range", async () => {
    const { owner, process } = await createScopedProcessFixture();
    const doc = await insertCompletedDocument(
      owner.organization.id,
      process.id,
      LIST_DRAFT_CONTENT,
    );

    // User selects the rendered text of a list item (without "- " marker)
    const renderedSelection = "Objeto: Contratacao de servicos de consultoria especializada";
    const sourceListItem = "- Objeto: Contratacao de servicos de consultoria especializada";
    const sourceStart = LIST_DRAFT_CONTENT.indexOf(sourceListItem) + 2; // skip "- "
    const sourceText = renderedSelection;

    // Verify our expected offsets via the resolver directly
    const resolved = resolveDocumentTextAdjustmentTarget({
      content: LIST_DRAFT_CONTENT,
      selectedText: renderedSelection,
    });
    assert.equal(resolved.start, sourceStart);
    assert.equal(LIST_DRAFT_CONTENT.slice(resolved.start, resolved.end), sourceText);

    const suggestResponse = await request(
      server,
      `/api/documents/${doc.id}/adjustments/suggestions`,
      {
        method: "POST",
        cookieJar: owner.cookieJar,
        body: { selectedText: renderedSelection, instruction: "Reformule." },
      },
    );
    const suggestion = await readJson<{
      sourceTarget: { start: number; end: number; sourceText: string };
      replacementText: string;
      sourceContentHash: string;
    }>(suggestResponse);

    assert.equal(suggestResponse.status, 200);
    assert.ok(suggestion);
    assert.equal(suggestion.sourceTarget.start, sourceStart);
    assert.equal(suggestion.sourceTarget.sourceText, sourceText);

    const applyResponse = await request(server, `/api/documents/${doc.id}/adjustments/apply`, {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        sourceTarget: suggestion.sourceTarget,
        replacementText: suggestion.replacementText,
        sourceContentHash: suggestion.sourceContentHash,
      },
    });

    assert.equal(applyResponse.status, 200);

    const persisted = await getDocumentById(server.app.db, doc.id);
    assert.ok(persisted?.draftContent);
    assert.ok(!persisted.draftContent.includes(renderedSelection));
    assert.ok(persisted.draftContent.includes(suggestion.replacementText));
  });

  test("4.2b wrapped rendered paragraph selection maps to correct source range", async () => {
    const { owner, process } = await createScopedProcessFixture();
    const sourceText = [
      "O objeto da contratação consiste na prestação de serviço de",
      "apresentação artística musical da banda FORRÓ TSUNAMI, em uma única execução.",
    ].join("\n");
    const draftContent = ["# DOCUMENTO DE FORMALIZACAO DE DEMANDA", "", sourceText].join("\n");
    const doc = await insertCompletedDocument(owner.organization.id, process.id, draftContent);

    const renderedSelection =
      "O objeto da contratação consiste na prestação de serviço de apresentação artística musi-\ncal da banda FORRÓ TSUNAMI, em uma única execução.";
    const sourceStart = draftContent.indexOf(sourceText);
    const resolved = resolveDocumentTextAdjustmentTarget({
      content: draftContent,
      selectedText: renderedSelection,
    });
    assert.equal(resolved.start, sourceStart);
    assert.equal(draftContent.slice(resolved.start, resolved.end), sourceText);

    const suggestResponse = await request(
      server,
      `/api/documents/${doc.id}/adjustments/suggestions`,
      {
        method: "POST",
        cookieJar: owner.cookieJar,
        body: { selectedText: renderedSelection, instruction: "Reformule." },
      },
    );
    const suggestion = await readJson<{
      sourceTarget: { start: number; end: number; sourceText: string };
      replacementText: string;
      sourceContentHash: string;
    }>(suggestResponse);

    assert.equal(suggestResponse.status, 200);
    assert.ok(suggestion);
    assert.equal(suggestion.sourceTarget.start, sourceStart);
    assert.equal(suggestion.sourceTarget.sourceText, sourceText);

    const applyResponse = await request(server, `/api/documents/${doc.id}/adjustments/apply`, {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        sourceTarget: suggestion.sourceTarget,
        replacementText: suggestion.replacementText,
        sourceContentHash: suggestion.sourceContentHash,
      },
    });

    assert.equal(applyResponse.status, 200);

    const persisted = await getDocumentById(server.app.db, doc.id);
    assert.ok(persisted?.draftContent);
    assert.ok(!persisted.draftContent.includes(sourceText));
    assert.ok(persisted.draftContent.includes(suggestion.replacementText));
  });

  test("4.3 stale, mismatched, ambiguous, and unresolvable targets leave draftContent unchanged", async () => {
    const { owner, process } = await createScopedProcessFixture();
    const doc = await insertCompletedDocument(
      owner.organization.id,
      process.id,
      PARA_DRAFT_CONTENT,
    );
    const originalContent = PARA_DRAFT_CONTENT;
    const selectedText = "Contratacao de servicos de TI para suporte tecnico especializado.";
    const validHash = getDocumentContentHash(originalContent);
    const resolvedTarget = resolveDocumentTextAdjustmentTarget({
      content: originalContent,
      selectedText,
    });

    // Stale hash
    const staleResponse = await request(server, `/api/documents/${doc.id}/adjustments/apply`, {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        sourceTarget: { ...resolvedTarget, sourceText: selectedText },
        replacementText: "Substituicao.",
        sourceContentHash: "sha256:stale",
      },
    });
    assert.equal(staleResponse.status, 409);

    // Mismatched sourceText (hash matches but sourceText doesn't)
    const mismatchedResponse = await request(server, `/api/documents/${doc.id}/adjustments/apply`, {
      method: "POST",
      cookieJar: owner.cookieJar,
      body: {
        sourceTarget: {
          start: resolvedTarget.start,
          end: resolvedTarget.end,
          sourceText: "texto que nao existe aqui",
        },
        replacementText: "Substituicao.",
        sourceContentHash: validHash,
      },
    });
    assert.equal(mismatchedResponse.status, 409);

    // Unresolvable selection (suggestion endpoint)
    const unresolvableResponse = await request(
      server,
      `/api/documents/${doc.id}/adjustments/suggestions`,
      {
        method: "POST",
        cookieJar: owner.cookieJar,
        body: {
          selectedText: "texto que definitivamente nao existe neste documento",
          instruction: "Reformule.",
        },
      },
    );
    assert.equal(unresolvableResponse.status, 409);

    // Document should be unchanged
    const persisted = await getDocumentById(server.app.db, doc.id);
    assert.equal(persisted?.draftContent, originalContent);
  });
});
