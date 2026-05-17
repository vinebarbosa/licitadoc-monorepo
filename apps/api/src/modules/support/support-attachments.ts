import type { FastifyInstance } from "fastify";
import type { Actor } from "../../authorization/actor";
import { BadRequestError } from "../../shared/errors/bad-request-error";
import { NotFoundError } from "../../shared/errors/not-found-error";
import type { FileStorageProvider } from "../../shared/storage/types";
import { canReadStoredSupportTicket } from "./support-tickets.policies";
import type { CreateSupportTicketAttachmentInput } from "./support-tickets.schemas";

export const SUPPORT_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const SUPPORT_IMAGE_MAX_COUNT = 4;

type MultipartFileValue = {
  fieldname: string;
  filename: string;
  mimetype: string;
  toBuffer(): Promise<Buffer>;
  type: "file";
};

type MultipartRequestBody = Record<string, MultipartFileValue | MultipartFileValue[] | unknown>;

export type SupportStoredAttachmentInput = {
  description: string;
  mimeType?: string | null;
  name: string;
  sizeBytes?: number | null;
  storageKey?: string | null;
  type: "screenshot" | "image";
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

export function isSupportImageMimeType(value: string): value is (typeof SUPPORT_IMAGE_MIME_TYPES)[number] {
  return SUPPORT_IMAGE_MIME_TYPES.includes(value as (typeof SUPPORT_IMAGE_MIME_TYPES)[number]);
}

export function isSupportImageStorageKeyForActor(storageKey: string, actor: Actor) {
  return storageKey.startsWith(`support-ticket-images/${actor.id}/`);
}

export function normalizeSupportAttachmentInput(
  attachment: CreateSupportTicketAttachmentInput,
  actor: Actor,
): SupportStoredAttachmentInput {
  if (attachment.type === "screenshot") {
    return {
      type: "screenshot",
      name: attachment.name,
      description: attachment.description,
    };
  }

  if (!isSupportImageStorageKeyForActor(attachment.storageKey, actor)) {
    throw new BadRequestError("Support image upload is not available for this user.");
  }

  if (!isSupportImageMimeType(attachment.mimeType)) {
    throw new BadRequestError("Support image must be PNG, JPEG, or WebP.");
  }

  return {
    type: "image",
    name: attachment.name,
    description: attachment.description,
    storageKey: attachment.storageKey,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
  };
}

export function normalizeSupportAttachmentInputs({
  actor,
  attachment,
  attachments,
}: {
  actor: Actor;
  attachment?: CreateSupportTicketAttachmentInput;
  attachments?: CreateSupportTicketAttachmentInput[];
}) {
  const normalized = [
    ...(attachment ? [attachment] : []),
    ...(attachments ?? []),
  ].map((entry) => normalizeSupportAttachmentInput(entry, actor));

  if (normalized.length > SUPPORT_IMAGE_MAX_COUNT) {
    throw new BadRequestError(`Support messages can include up to ${SUPPORT_IMAGE_MAX_COUNT} images.`);
  }

  return normalized;
}

export async function uploadSupportTicketImage({
  actor,
  body,
  maxBytes,
  storage,
}: {
  actor: Actor;
  body: MultipartRequestBody | undefined;
  maxBytes: number;
  storage: FileStorageProvider;
}) {
  const files = getMultipartFiles(body);

  if (files.length !== 1) {
    throw new BadRequestError("Envie exatamente uma imagem.");
  }

  const file = files[0];

  if (!isSupportImageMimeType(file.mimetype)) {
    throw new BadRequestError("A imagem precisa ser PNG, JPEG ou WebP.");
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
      throw new BadRequestError("A imagem precisa ter até 5 MB.");
    }

    throw error;
  }

  if (buffer.byteLength === 0) {
    throw new BadRequestError("A imagem não pode estar vazia.");
  }

  if (buffer.byteLength > maxBytes) {
    throw new BadRequestError("A imagem precisa ter até 5 MB.");
  }

  const storedImage = await storage.storeSupportTicketImage({
    buffer,
    contentType: file.mimetype,
    fileName: file.filename,
    uploadedByUserId: actor.id,
  });

  return {
    type: "image" as const,
    name: file.filename,
    description: "Imagem anexada pelo usuário.",
    storageKey: storedImage.key,
    mimeType: file.mimetype,
    sizeBytes: storedImage.sizeBytes,
  };
}

export async function getSupportTicketImageAttachment({
  actor,
  attachmentId,
  db,
  ticketId,
}: {
  actor: Actor;
  attachmentId: string;
  db: FastifyInstance["db"];
  ticketId: string;
}) {
  const ticket = await db.query.supportTickets.findFirst({
    where: (table, { eq }) => eq(table.id, ticketId),
  });

  if (!ticket) {
    throw new NotFoundError("Support ticket not found.");
  }

  canReadStoredSupportTicket(actor, ticket);

  const attachment = await db.query.supportTicketAttachments.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.id, attachmentId), eq(table.ticketId, ticket.id)),
  });

  if (!attachment || attachment.type !== "image" || !attachment.storageKey) {
    throw new NotFoundError("Support ticket attachment not found.");
  }

  return attachment;
}
