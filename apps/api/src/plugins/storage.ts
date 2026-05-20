import fp from "fastify-plugin";
import { S3FileStorageProvider } from "../shared/storage/s3-provider";
import type { FileStorageProvider } from "../shared/storage/types";
import { VercelBlobStorageProvider } from "../shared/storage/vercel-blob-provider";

declare module "fastify" {
  interface FastifyInstance {
    storage: FileStorageProvider;
  }
}

export const registerStoragePlugin = fp(async (app) => {
  if (app.config.STORAGE_PROVIDER === "vercel-blob") {
    app.decorate(
      "storage",
      new VercelBlobStorageProvider({
        access: app.config.STORAGE_VERCEL_BLOB_ACCESS,
        token: app.config.BLOB_READ_WRITE_TOKEN,
      }),
    );

    return;
  }

  if (app.config.STORAGE_PROVIDER === "s3") {
    app.decorate(
      "storage",
      new S3FileStorageProvider({
        accessKeyId: app.config.STORAGE_S3_ACCESS_KEY_ID,
        bucket: app.config.STORAGE_S3_BUCKET,
        endpoint: app.config.STORAGE_S3_ENDPOINT,
        forcePathStyle: app.config.STORAGE_S3_FORCE_PATH_STYLE,
        region: app.config.STORAGE_S3_REGION,
        secretAccessKey: app.config.STORAGE_S3_SECRET_ACCESS_KEY,
      }),
    );

    return;
  }

  throw new Error(`Unsupported storage provider: ${app.config.STORAGE_PROVIDER}`);
});
