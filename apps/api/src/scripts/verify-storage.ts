import { config as loadEnv } from "dotenv";
import { parseApiEnv } from "../plugins/env";
import { S3FileStorageProvider } from "../shared/storage/s3-provider";

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function main() {
  loadEnv();

  const env = parseApiEnv(process.env);
  const storage = new S3FileStorageProvider({
    accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
    bucket: env.STORAGE_S3_BUCKET,
    endpoint: env.STORAGE_S3_ENDPOINT,
    forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
    region: env.STORAGE_S3_REGION,
    secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
  });
  const expectedBody = Buffer.from(`licitadoc storage verification ${new Date().toISOString()}`);
  const storedObject = await storage.storeSupportTicketImage({
    buffer: expectedBody,
    contentType: "text/plain; charset=utf-8",
    fileName: "storage-verification.txt",
    uploadedByUserId: "storage-verification",
  });

  try {
    const storedContent = await storage.getObject({ key: storedObject.key });
    const actualBody = await streamToBuffer(storedContent.body);

    if (!actualBody.equals(expectedBody)) {
      throw new Error("Storage verification object content mismatch.");
    }

    console.log("Storage verification succeeded.");
    console.log(`Endpoint: ${env.STORAGE_S3_ENDPOINT}`);
    console.log(`Bucket: ${storedObject.bucket}`);
    console.log(`Object key: ${storedObject.key}`);
  } finally {
    await storage.deleteObject({
      bucket: storedObject.bucket,
      key: storedObject.key,
    });
  }
}

main().catch((error) => {
  loadEnv();

  const env = parseApiEnv(process.env);

  console.error("Storage verification failed.");
  console.error(`Endpoint: ${env.STORAGE_S3_ENDPOINT}`);
  console.error(`Bucket: ${env.STORAGE_S3_BUCKET}`);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
