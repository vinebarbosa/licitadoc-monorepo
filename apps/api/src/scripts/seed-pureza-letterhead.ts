import { readFile } from "node:fs/promises";
import { buildApp } from "../app/build-app";
import {
  PUREZA_LETTERHEAD_DEFAULT_PATH,
  seedPurezaLetterhead,
} from "../modules/organizations/pureza-letterhead-seed";

async function main() {
  const app = await buildApp();

  try {
    await app.ready();

    const filePath = process.env.PUREZA_LETTERHEAD_PATH || PUREZA_LETTERHEAD_DEFAULT_PATH;
    const organization = await seedPurezaLetterhead({
      db: app.db,
      filePath,
      maxBytes: app.config.SUPPORT_IMAGE_MAX_BYTES,
      organizationId: process.env.PUREZA_ORGANIZATION_ID || null,
      readFile,
      storage: app.storage,
    });

    console.log("");
    console.log("Pureza/RN letterhead is ready.");
    console.log(`Organization id: ${organization.id}`);
    console.log(`Organization CNPJ: ${organization.cnpj}`);
    console.log(`Letterhead URL: ${organization.letterheadUrl ?? "n/a"}`);
    console.log("");
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
