import fp from "fastify-plugin";
import { S3FileStorageProvider } from "../shared/storage/s3-provider";
import type { FileStorageProvider } from "../shared/storage/types";

declare module "fastify" {
  interface FastifyInstance {
    storage: FileStorageProvider;
  }
}

export const registerStoragePlugin = fp(async (app) => {
  if (app.config.STORAGE_PROVIDER !== "s3") {
    throw new Error(`Unsupported storage provider: ${app.config.STORAGE_PROVIDER}`);
  }

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
});
