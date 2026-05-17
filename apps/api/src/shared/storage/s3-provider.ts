import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchBucket,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type {
  FileStorageProvider,
  StoredObject,
  StoredObjectContent,
  StoreObjectInput,
  StoreSupportImageInput,
} from "./types";

type S3FileStorageProviderOptions = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  region: string;
  secretAccessKey: string;
};

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

export class S3FileStorageProvider implements FileStorageProvider {
  private readonly bucket: string;
  private readonly client: S3Client;
  private bucketReadyPromise: Promise<void> | null = null;

  constructor(options: S3FileStorageProviderOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async deleteObject(object: Pick<StoredObject, "bucket" | "key">) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
      }),
    );
  }

  async getObject(object: Pick<StoredObject, "key">): Promise<StoredObjectContent> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: object.key,
      }),
    );

    if (!response.Body) {
      throw new Error("Stored object body is empty.");
    }

    const body =
      response.Body instanceof Readable
        ? response.Body
        : Readable.from(await response.Body.transformToByteArray());

    return {
      body,
      contentLength: response.ContentLength ?? null,
      contentType: response.ContentType ?? null,
    };
  }

  async storeExpenseRequestPdf(input: StoreObjectInput) {
    await this.ensureBucket();

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const key = [
      "expense-requests",
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${timestamp}-${sanitizeFileName(input.fileName) || "expense-request.pdf"}`,
    ].join("/");

    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
        Metadata: {
          originalfilename: input.fileName,
        },
      }),
    );

    return {
      bucket: this.bucket,
      contentType: input.contentType,
      etag: response.ETag?.replaceAll('"', "") ?? null,
      key,
      sizeBytes: input.buffer.byteLength,
      uploadedAt: now.toISOString(),
    };
  }

  async storeSupportTicketImage(input: StoreSupportImageInput) {
    await this.ensureBucket();

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const key = [
      "support-ticket-images",
      sanitizeKeySegment(input.uploadedByUserId),
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${timestamp}-${randomUUID()}-${sanitizeFileName(input.fileName) || "captura.png"}`,
    ].join("/");

    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
        Metadata: {
          originalfilename: input.fileName,
          uploadedbyuserid: input.uploadedByUserId,
        },
      }),
    );

    return {
      bucket: this.bucket,
      contentType: input.contentType,
      etag: response.ETag?.replaceAll('"', "") ?? null,
      key,
      sizeBytes: input.buffer.byteLength,
      uploadedAt: now.toISOString(),
    };
  }

  private async ensureBucket() {
    if (!this.bucketReadyPromise) {
      this.bucketReadyPromise = this.createBucketIfMissing();
    }

    return this.bucketReadyPromise;
  }

  private async createBucketIfMissing() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
    } catch (error) {
      if (!(error instanceof NoSuchBucket) && !this.isMissingBucketError(error)) {
        this.bucketReadyPromise = null;
        throw error;
      }

      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        }),
      );
    }
  }

  private isMissingBucketError(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      ("$metadata" in error || "Code" in error) &&
      "name" in error &&
      (error.name === "NotFound" ||
        error.name === "NoSuchBucket" ||
        (typeof (error as { Code?: string }).Code === "string" &&
          (error as { Code: string }).Code === "NoSuchBucket"))
    );
  }
}
