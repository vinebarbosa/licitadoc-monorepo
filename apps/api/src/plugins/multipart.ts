import multipart from "@fastify/multipart";
import fp from "fastify-plugin";

export const registerMultipartPlugin = fp(async (app) => {
  await app.register(multipart, {
    attachFieldsToBody: true,
    throwFileSizeLimit: true,
    limits: {
      files: 1,
      fileSize: app.config.EXPENSE_REQUEST_PDF_MAX_BYTES,
      fields: 10,
      parts: 11,
    },
  });
});
