import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { test } from "vitest";
import { VercelBlobStorageProvider } from "./vercel-blob-provider";

function createBlobClientStub() {
  const calls: {
    del: Array<{ key: string; options: Record<string, unknown> }>;
    get: Array<{ key: string; options: Record<string, unknown> }>;
    put: Array<{ body: unknown; key: string; options: Record<string, unknown> }>;
  } = {
    del: [],
    get: [],
    put: [],
  };

  return {
    calls,
    client: {
      del: async (key: string, options: Record<string, unknown>) => {
        calls.del.push({ key, options });
      },
      get: async (key: string, options: Record<string, unknown>) => {
        calls.get.push({ key, options });

        return {
          blob: {
            cacheControl: "public, max-age=31536000",
            contentDisposition: 'inline; filename="storage-verification.txt"',
            contentType: "text/plain; charset=utf-8",
            downloadUrl: `https://example.com/${key}?download=1`,
            etag: "etag-1",
            pathname: key,
            size: 12,
            uploadedAt: new Date("2026-05-20T12:00:00.000Z"),
            url: `https://example.com/${key}`,
          },
          headers: new Headers(),
          statusCode: 200,
          stream: new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(Buffer.from("hello blob"));
              controller.close();
            },
          }),
        };
      },
      put: async (key: string, body: unknown, options: Record<string, unknown>) => {
        calls.put.push({ body, key, options });

        return {
          contentDisposition: `inline; filename="${key.split("/").at(-1)}"`,
          contentType: String(options.contentType),
          downloadUrl: `https://example.com/${key}?download=1`,
          etag: '"etag-1"',
          pathname: key,
          url: `https://example.com/${key}`,
        };
      },
    },
  };
}

test("VercelBlobStorageProvider stores support images using public blob access", async () => {
  const { calls, client } = createBlobClientStub();
  const storage = new VercelBlobStorageProvider({
    access: "public",
    client: client as never,
    token: "blob-token",
  });

  const storedObject = await storage.storeSupportTicketImage({
    buffer: Buffer.from("image"),
    contentType: "image/png",
    fileName: "Captura de Tela.png",
    uploadedByUserId: "user 123",
  });

  assert.equal(calls.put.length, 1);
  assert.match(storedObject.key, /^support-ticket-images\/user-123\/\d{4}\/\d{2}\//);
  assert.equal(storedObject.bucket, "vercel-blob");
  assert.equal(storedObject.contentType, "image/png");
  assert.equal(storedObject.etag, "etag-1");
  assert.equal(calls.put[0]?.options.access, "public");
  assert.equal(calls.put[0]?.options.addRandomSuffix, false);
  assert.equal(calls.put[0]?.options.allowOverwrite, false);
  assert.equal(calls.put[0]?.options.token, "blob-token");
});

test("VercelBlobStorageProvider overwrites organization letterheads at their stable key", async () => {
  const { calls, client } = createBlobClientStub();
  const storage = new VercelBlobStorageProvider({
    access: "public",
    client: client as never,
  });

  const storedObject = await storage.storeOrganizationLetterhead({
    buffer: Buffer.from("png"),
    contentType: "image/png",
    fileName: "papel.png",
    organizationId: "org-1",
  });

  assert.equal(storedObject.key, "organization-letterheads/org-1/papel-timbrado");
  assert.equal(calls.put[0]?.key, "organization-letterheads/org-1/papel-timbrado");
  assert.equal(calls.put[0]?.options.allowOverwrite, true);
});

test("VercelBlobStorageProvider reads and deletes blobs by pathname", async () => {
  const { calls, client } = createBlobClientStub();
  const storage = new VercelBlobStorageProvider({
    access: "public",
    client: client as never,
  });

  const content = await storage.getObject({ key: "support-ticket-images/user-1/file.png" });
  const chunks: Buffer[] = [];

  for await (const chunk of content.body as Readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  await storage.deleteObject({ key: "support-ticket-images/user-1/file.png" });

  assert.equal(Buffer.concat(chunks).toString("utf8"), "hello blob");
  assert.equal(content.contentLength, 12);
  assert.equal(content.contentType, "text/plain; charset=utf-8");
  assert.equal(calls.get[0]?.key, "support-ticket-images/user-1/file.png");
  assert.equal(calls.get[0]?.options.access, "public");
  assert.equal(calls.del[0]?.key, "support-ticket-images/user-1/file.png");
});
