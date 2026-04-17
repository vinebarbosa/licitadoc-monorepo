import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildApp } from "./build-app";

async function exportOpenApi() {
  const app = await buildApp();

  try {
    await app.ready();

    const document = await app.getOpenApiDocument();
    const outputDir = path.resolve(process.cwd(), "openapi");
    const outputFile = path.join(outputDir, "openapi.json");

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputFile, JSON.stringify(document, null, 2), "utf8");

    app.log.info(`OpenAPI schema written to ${outputFile}`);
  } finally {
    await app.close();
  }
}

void exportOpenApi();
