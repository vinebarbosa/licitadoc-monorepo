import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { del, get, put } from "@vercel/blob";
import type {
  FileStorageProvider,
  StoredObject,
  StoredObjectContent,
  StoreObjectInput,
  StoreOrganizationAssetInput,
  StoreOrganizationLetterheadInput,
  StoreSupportImageInput,
} from "./types";
import { getOrganizationAssetStorageKey, getOrganizationLetterheadStorageKey } from "./types";

type BlobAccess = "private" | "public";

type VercelBlobStorageProviderOptions = {
  access: BlobAccess;
  bucketLabel?: string;
  token?: string;
};

type BlobClient = {
  del: typeof del;
  get: typeof get;
  put: typeof put;
};

type VercelBlobStorageProviderTestOptions = VercelBlobStorageProviderOptions & {
  client?: BlobClient;
};

const DEFAULT_BUCKET_LABEL = "vercel-blob";
const MULTIPART_UPLOAD_THRESHOLD_BYTES = 4 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function sanitizeKeySegment(value: string) {
  return sanitizeFileName(value) || "unknown";
}

export class VercelBlobStorageProvider implements FileStorageProvider {
  private readonly access: BlobAccess;
  private readonly bucketLabel: string;
  private readonly client: BlobClient;
  private readonly token?: string;

  constructor(options: VercelBlobStorageProviderTestOptions) {
    this.access = options.access;
    this.bucketLabel = options.bucketLabel ?? DEFAULT_BUCKET_LABEL;
    this.client = options.client ?? { del, get, put };
    this.token = options.token;
  }

  async deleteObject(object: Pick<StoredObject, "key">) {
    await this.client.del(object.key, this.getCommandOptions());
  }

  async getObject(object: Pick<StoredObject, "key">): Promise<StoredObjectContent> {
    const response = await this.client.get(object.key, {
      ...this.getCommandOptions(),
      access: this.access,
    });

    if (!response || response.statusCode !== 200 || !response.stream) {
      throw new Error("Stored object body is empty.");
    }

    return {
      body: Readable.fromWeb(response.stream),
      contentLength: response.blob.size,
      contentType: response.blob.contentType,
    };
  }

  async storeExpenseRequestPdf(input: StoreObjectInput) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const key = [
      "expense-requests",
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${timestamp}-${sanitizeFileName(input.fileName) || "expense-request.pdf"}`,
    ].join("/");

    return this.storeObject(key, input, now);
  }

  async storeSupportTicketImage(input: StoreSupportImageInput) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const key = [
      "support-ticket-images",
      sanitizeKeySegment(input.uploadedByUserId),
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${timestamp}-${randomUUID()}-${sanitizeFileName(input.fileName) || "captura.png"}`,
    ].join("/");

    return this.storeObject(key, input, now);
  }

  async storeOrganizationLetterhead(input: StoreOrganizationLetterheadInput) {
    const now = new Date();
    const key = getOrganizationLetterheadStorageKey(input.organizationId);

    return this.storeObject(key, input, now, { allowOverwrite: true });
  }

  async storeOrganizationAsset(input: StoreOrganizationAssetInput) {
    const now = new Date();
    const key = getOrganizationAssetStorageKey(input.organizationId, input.assetKind);

    return this.storeObject(key, input, now, { allowOverwrite: true });
  }

  private async storeObject(
    key: string,
    input: StoreObjectInput,
    uploadedAt: Date,
    options: { allowOverwrite?: boolean } = {},
  ): Promise<StoredObject> {
    const blob = await this.client.put(key, input.buffer, {
      ...this.getCommandOptions(),
      access: this.access,
      addRandomSuffix: false,
      allowOverwrite: options.allowOverwrite ?? false,
      contentType: input.contentType,
      multipart: input.buffer.byteLength > MULTIPART_UPLOAD_THRESHOLD_BYTES,
    });

    return {
      bucket: this.bucketLabel,
      contentType: blob.contentType,
      etag: blob.etag?.replaceAll('"', "") ?? null,
      key: blob.pathname,
      sizeBytes: input.buffer.byteLength,
      uploadedAt: uploadedAt.toISOString(),
    };
  }

  private getCommandOptions() {
    return this.token ? { token: this.token } : {};
  }
}
