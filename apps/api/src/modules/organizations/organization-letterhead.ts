import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import {
  type FileStorageProvider,
  getOrganizationLetterheadStorageKey,
  ORGANIZATION_LETTERHEAD_FILE_NAME,
} from "../../shared/storage/types";
import { canUpdateStoredOrganization } from "./organizations.policies";
import {
  isActorInOrganization,
  type StoredOrganization,
  serializeOrganization,
} from "./organizations.shared";

export const ORGANIZATION_LETTERHEAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

type MultipartFileValue = {
  fieldname: string;
  filename: string;
  mimetype: string;
  toBuffer(): Promise<Buffer>;
  type: "file";
};

type MultipartRequestBody = Record<string, MultipartFileValue | MultipartFileValue[] | unknown>;

type LetterheadImageDimensions = {
  height: number;
  width: number;
};

type NormalizedLetterheadUpload = {
  buffer: Buffer;
  contentType: (typeof ORGANIZATION_LETTERHEAD_MIME_TYPES)[number];
  fileName: string;
};

function isMultipartFileValue(value: unknown): value is MultipartFileValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "file" &&
    "toBuffer" in value &&
    typeof value.toBuffer === "function" &&
    "filename" in value &&
    typeof value.filename === "string" &&
    "mimetype" in value &&
    typeof value.mimetype === "string"
  );
}

function getMultipartFiles(body: MultipartRequestBody | undefined) {
  if (!body) {
    return [];
  }

  return Object.values(body)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(isMultipartFileValue);
}

export function isOrganizationLetterheadMimeType(
  value: string,
): value is (typeof ORGANIZATION_LETTERHEAD_MIME_TYPES)[number] {
  return ORGANIZATION_LETTERHEAD_MIME_TYPES.includes(
    value as (typeof ORGANIZATION_LETTERHEAD_MIME_TYPES)[number],
  );
}

function readUInt24LE(buffer: Buffer, offset: number) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function getPngDimensions(buffer: Buffer): LetterheadImageDimensions | null {
  const hasPngSignature =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (!hasPngSignature) {
    return null;
  }

  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  };
}

function getJpegDimensions(buffer: Buffer): LetterheadImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 2 > buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    const segmentStart = offset + 2;

    if (segmentLength < 2 || segmentStart + segmentLength - 2 > buffer.length) {
      break;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame && segmentLength >= 7) {
      return {
        height: buffer.readUInt16BE(segmentStart + 1),
        width: buffer.readUInt16BE(segmentStart + 3),
      };
    }

    offset = segmentStart + segmentLength - 2;
  }

  return null;
}

function getWebpDimensions(buffer: Buffer): LetterheadImageDimensions | null {
  if (
    buffer.length < 30 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8X" && buffer.length >= 30) {
    return {
      height: readUInt24LE(buffer, 27) + 1,
      width: readUInt24LE(buffer, 24) + 1,
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];

    return {
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      width: 1 + (((b1 & 0x3f) << 8) | b0),
    };
  }

  if (
    chunkType === "VP8 " &&
    buffer.length >= 30 &&
    buffer[23] === 0x9d &&
    buffer[24] === 0x01 &&
    buffer[25] === 0x2a
  ) {
    return {
      height: buffer.readUInt16LE(28) & 0x3fff,
      width: buffer.readUInt16LE(26) & 0x3fff,
    };
  }

  return null;
}

export function getLetterheadImageDimensions(
  buffer: Buffer,
  contentType: string,
): LetterheadImageDimensions | null {
  if (contentType === "image/png") {
    return getPngDimensions(buffer);
  }

  if (contentType === "image/jpeg") {
    return getJpegDimensions(buffer);
  }

  if (contentType === "image/webp") {
    return getWebpDimensions(buffer);
  }

  return null;
}

export function validateLetterheadImageBuffer({
  buffer,
  contentType,
  maxBytes,
}: {
  buffer: Buffer;
  contentType: string;
  maxBytes: number;
}) {
  if (!isOrganizationLetterheadMimeType(contentType)) {
    throw new BadRequestError("O timbre precisa ser PNG, JPEG ou WebP.");
  }

  if (buffer.byteLength === 0) {
    throw new BadRequestError("O timbre não pode estar vazio.");
  }

  if (buffer.byteLength > maxBytes) {
    throw new BadRequestError("O timbre precisa respeitar o limite de tamanho configurado.");
  }

  return getLetterheadImageDimensions(buffer, contentType);
}

async function normalizeLetterheadUpload({
  body,
  maxBytes,
}: {
  body: MultipartRequestBody | undefined;
  maxBytes: number;
}): Promise<NormalizedLetterheadUpload> {
  const files = getMultipartFiles(body);

  if (files.length !== 1) {
    throw new BadRequestError("Envie exatamente uma imagem de timbre.");
  }

  const file = files[0];

  if (!isOrganizationLetterheadMimeType(file.mimetype)) {
    throw new BadRequestError("O timbre precisa ser PNG, JPEG ou WebP.");
  }

  let buffer: Buffer;

  try {
    buffer = await file.toBuffer();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "FastifyError"
    ) {
      throw new BadRequestError("O timbre precisa respeitar o limite de tamanho configurado.");
    }

    throw error;
  }

  validateLetterheadImageBuffer({
    buffer,
    contentType: file.mimetype,
    maxBytes,
  });

  return {
    buffer,
    contentType: file.mimetype,
    fileName: file.filename,
  };
}

export function getOrganizationLetterheadUrl(organizationId: string) {
  return `/api/organizations/${organizationId}/letterhead/image`;
}

export async function setOrganizationLetterhead({
  db,
  file,
  organization,
  storage,
}: {
  db: FastifyInstance["db"];
  file: NormalizedLetterheadUpload;
  organization: StoredOrganization;
  storage: FileStorageProvider;
}) {
  await storage.storeOrganizationLetterhead({
    buffer: file.buffer,
    contentType: file.contentType,
    fileName: file.fileName,
    organizationId: organization.id,
  });

  const [updatedOrganization] = await db
    .update(organizations)
    .set({
      letterheadUrl: getOrganizationLetterheadUrl(organization.id),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organization.id))
    .returning();

  if (!updatedOrganization) {
    throw new NotFoundError("Organization not found.");
  }

  return updatedOrganization;
}

function canReadStoredOrganizationLetterhead(
  actor: Actor,
  organization: Pick<StoredOrganization, "id">,
) {
  if (actor.role === "admin") {
    return true;
  }

  if (
    (actor.role === "organization_owner" || actor.role === "member") &&
    isActorInOrganization(actor, organization)
  ) {
    return true;
  }

  throw new ForbiddenError("You do not have permission to read this organization letterhead.");
}

export async function uploadOrganizationLetterhead({
  actor,
  body,
  db,
  maxBytes,
  organizationId,
  storage,
}: {
  actor: Actor;
  body: MultipartRequestBody | undefined;
  db: FastifyInstance["db"];
  maxBytes: number;
  organizationId: string;
  storage: FileStorageProvider;
}) {
  const organization = await db.query.organizations.findFirst({
    where: (table, { eq: equals }) => equals(table.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  canUpdateStoredOrganization(actor, organization);

  const file = await normalizeLetterheadUpload({ body, maxBytes });
  const updatedOrganization = await setOrganizationLetterhead({
    db,
    file,
    organization,
    storage,
  });

  return serializeOrganization(updatedOrganization);
}

export async function getOrganizationLetterheadImage({
  actor,
  db,
  organizationId,
}: {
  actor: Actor;
  db: FastifyInstance["db"];
  organizationId: string;
}) {
  const organization = await db.query.organizations.findFirst({
    where: (table, { eq: equals }) => equals(table.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  canReadStoredOrganizationLetterhead(actor, organization);

  if (!organization.letterheadUrl) {
    throw new NotFoundError("Organization letterhead not found.");
  }

  return {
    fileName: ORGANIZATION_LETTERHEAD_FILE_NAME,
    storageKey: getOrganizationLetterheadStorageKey(organization.id),
  };
}

export function createNormalizedLetterheadFileForImport({
  buffer,
  contentType,
  fileName,
  maxBytes,
}: {
  buffer: Buffer;
  contentType: string;
  fileName: string;
  maxBytes: number;
}): NormalizedLetterheadUpload {
  validateLetterheadImageBuffer({ buffer, contentType, maxBytes });

  if (!isOrganizationLetterheadMimeType(contentType)) {
    throw new BadRequestError("O timbre precisa ser PNG, JPEG ou WebP.");
  }

  return {
    buffer,
    contentType,
    fileName,
  };
}
