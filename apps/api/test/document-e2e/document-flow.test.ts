import assert from "node:assert/strict";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
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
