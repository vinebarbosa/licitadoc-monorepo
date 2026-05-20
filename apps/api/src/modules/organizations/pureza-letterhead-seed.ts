import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { organizations } from "../../db";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { FileStorageProvider } from "../../shared/storage/types";
import {
  createNormalizedLetterheadFileForImport,
  setOrganizationLetterhead,
} from "./organization-letterhead";

export const PUREZA_LETTERHEAD_DEFAULT_PATH =
  "/Users/vine/Desktop/ARQUIVOS LICITADOC/IMAGENS PREF PUREZA/papel_timbrado.png";
export const PUREZA_CNPJ_DIGITS = "08290223000142";
export const PUREZA_LETTERHEAD_CANDIDATE_SLUGS = [
  "pureza",
  "municipio-de-pureza",
  "prefeitura-de-pureza",
  "expense-request-upload-pureza",
] as const;

type ReadFile = (path: string) => Promise<Buffer>;

export async function resolvePurezaOrganizationForLetterhead({
  db,
  organizationId,
}: {
  db: FastifyInstance["db"];
  organizationId?: string | null;
}) {
  if (organizationId) {
    return db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });
  }

  return db.query.organizations.findFirst({
    where: (table, { or }) =>
      or(
        sql`regexp_replace(${table.cnpj}, '[^0-9]', '', 'g') = ${PUREZA_CNPJ_DIGITS}`,
        ...PUREZA_LETTERHEAD_CANDIDATE_SLUGS.map((slug) => eq(table.slug, slug)),
      ),
  });
}

export async function seedPurezaLetterhead({
  db,
  filePath = PUREZA_LETTERHEAD_DEFAULT_PATH,
  maxBytes,
  organizationId,
  readFile,
  storage,
}: {
  db: FastifyInstance["db"];
  filePath?: string;
  maxBytes: number;
  organizationId?: string | null;
  readFile: ReadFile;
  storage: FileStorageProvider;
}) {
  const organization = await resolvePurezaOrganizationForLetterhead({ db, organizationId });

  if (!organization) {
    throw new NotFoundError("Pureza organization could not be resolved; no upload was performed.");
  }

  const buffer = await readFile(filePath);
  const file = createNormalizedLetterheadFileForImport({
    buffer,
    contentType: "image/png",
    fileName: filePath.split("/").pop() || "papel_timbrado.png",
    maxBytes,
  });
  const updatedOrganization = await setOrganizationLetterhead({
    db,
    file,
    organization,
    storage,
  });

  return updatedOrganization satisfies typeof organizations.$inferSelect;
}
