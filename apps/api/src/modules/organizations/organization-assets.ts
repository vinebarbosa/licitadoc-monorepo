import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { organizations } from "../../db";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { ForbiddenError } from "../../shared/errors/forbidden-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import {
  type FileStorageProvider,
  getOrganizationAssetStorageKey,
  type OrganizationAssetKind,
} from "../../shared/storage/types";
import { canUpdateStoredOrganization } from "./organizations.policies";
import {
  isActorInOrganization,
  type StoredOrganization,
  serializeOrganization,
} from "./organizations.shared";

const ORGANIZATION_VISUAL_ASSET_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
] as const;

const ORGANIZATION_LETTERHEAD_TEMPLATE_MIME_TYPES = [
  "application/msword",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

type MultipartFileValue = {
  fieldname: string;
  filename: string;
  mimetype: string;
  toBuffer(): Promise<Buffer>;
  type: "file";
};

type MultipartRequestBody = Record<
  string,
  MultipartFileValue | Array<MultipartFileValue | unknown> | unknown
>;

type NormalizedOrganizationAssetUpload = {
  buffer: Buffer;
  contentType: string;
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

function getOrganizationAssetLabel(assetKind: OrganizationAssetKind) {
  if (assetKind === "logo") {
    return "logomarca";
  }

  if (assetKind === "crest") {
    return "brasão";
  }

  return "modelo de papel timbrado";
}

function isSupportedOrganizationAssetMimeType(assetKind: OrganizationAssetKind, value: string) {
  if (assetKind === "letterhead-template") {
    return ORGANIZATION_LETTERHEAD_TEMPLATE_MIME_TYPES.includes(
      value as (typeof ORGANIZATION_LETTERHEAD_TEMPLATE_MIME_TYPES)[number],
    );
  }

  return ORGANIZATION_VISUAL_ASSET_MIME_TYPES.includes(
    value as (typeof ORGANIZATION_VISUAL_ASSET_MIME_TYPES)[number],
  );
}

function getOrganizationAssetUrl(organizationId: string, assetKind: OrganizationAssetKind) {
  return `/api/organizations/${organizationId}/${assetKind}/file`;
}

function getOrganizationAssetFileName(assetKind: OrganizationAssetKind) {
  if (assetKind === "logo") {
    return "logomarca";
  }

  if (assetKind === "crest") {
    return "brasao";
  }

  return "modelo-papel-timbrado";
}

function getOrganizationAssetUrlField(assetKind: OrganizationAssetKind) {
  if (assetKind === "logo") {
    return "logoUrl" as const;
  }

  if (assetKind === "crest") {
    return "crestUrl" as const;
  }

  return "letterheadTemplateUrl" as const;
}

function readOrganizationAssetUrl(
  organization: StoredOrganization,
  assetKind: OrganizationAssetKind,
) {
  return organization[getOrganizationAssetUrlField(assetKind)];
}

async function normalizeOrganizationAssetUpload({
  assetKind,
  body,
  maxBytes,
}: {
  assetKind: OrganizationAssetKind;
  body: MultipartRequestBody | undefined;
  maxBytes: number;
}): Promise<NormalizedOrganizationAssetUpload> {
  const files = getMultipartFiles(body);
  const assetLabel = getOrganizationAssetLabel(assetKind);

  if (files.length !== 1) {
    throw new BadRequestError(`Envie exatamente um arquivo de ${assetLabel}.`);
  }

  const file = files[0];

  if (!isSupportedOrganizationAssetMimeType(assetKind, file.mimetype)) {
    throw new BadRequestError(`O arquivo de ${assetLabel} tem um formato não suportado.`);
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
      throw new BadRequestError(`O arquivo de ${assetLabel} excede o limite permitido.`);
    }

    throw error;
  }

  if (buffer.byteLength === 0) {
    throw new BadRequestError(`O arquivo de ${assetLabel} não pode estar vazio.`);
  }

  if (buffer.byteLength > maxBytes) {
    throw new BadRequestError(`O arquivo de ${assetLabel} excede o limite permitido.`);
  }

  return {
    buffer,
    contentType: file.mimetype,
    fileName: file.filename,
  };
}

function canReadStoredOrganizationAsset(
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

  throw new ForbiddenError("You do not have permission to read this organization asset.");
}

export async function uploadOrganizationAsset({
  actor,
  assetKind,
  body,
  db,
  maxBytes,
  organizationId,
  storage,
}: {
  actor: Actor;
  assetKind: OrganizationAssetKind;
  body: MultipartRequestBody | undefined;
  db: FastifyInstance["db"];
  maxBytes: number;
  organizationId: string;
  storage: FileStorageProvider;
}) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  canUpdateStoredOrganization(actor, organization);

  const file = await normalizeOrganizationAssetUpload({ assetKind, body, maxBytes });

  await storage.storeOrganizationAsset({
    assetKind,
    buffer: file.buffer,
    contentType: file.contentType,
    fileName: file.fileName,
    organizationId,
  });

  const [updatedOrganization] = await db
    .update(organizations)
    .set({
      [getOrganizationAssetUrlField(assetKind)]: getOrganizationAssetUrl(organizationId, assetKind),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId))
    .returning();

  if (!updatedOrganization) {
    throw new NotFoundError("Organization not found.");
  }

  return serializeOrganization(updatedOrganization);
}

export async function getOrganizationAssetFile({
  actor,
  assetKind,
  db,
  organizationId,
}: {
  actor: Actor;
  assetKind: OrganizationAssetKind;
  db: FastifyInstance["db"];
  organizationId: string;
}) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  canReadStoredOrganizationAsset(actor, organization);

  if (!readOrganizationAssetUrl(organization, assetKind)) {
    throw new NotFoundError("Organization asset not found.");
  }

  return {
    fileName: getOrganizationAssetFileName(assetKind),
    storageKey: getOrganizationAssetStorageKey(organization.id, assetKind),
  };
}
