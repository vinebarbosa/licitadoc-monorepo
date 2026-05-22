import type { FastifyReply } from "fastify";
import type { FastifyPluginAsyncZodOpenApi } from "fastify-zod-openapi";
import type { Actor } from "../../authorization/actor";
import { getSessionUser } from "../../shared/auth/get-session-user";
import { createOrganization } from "./create-organization";
import { getCurrentOrganization } from "./get-current-organization";
import { getOrganization } from "./get-organization";
import { getOrganizations } from "./get-organizations";
import { getOrganizationAssetFile, uploadOrganizationAsset } from "./organization-assets";
import {
  getOrganizationLetterheadImage,
  hasOrganizationLetterheadUpload,
  isMultipartFileValue,
  type MultipartRequestBody,
  normalizeLetterheadUpload,
  normalizeMultipartTextFields,
  uploadOrganizationLetterhead,
} from "./organization-letterhead";
import {
  createOrganizationSchema,
  getCurrentOrganizationSchema,
  getOrganizationAssetFileSchema,
  getOrganizationLetterheadImageSchema,
  getOrganizationSchema,
  getOrganizationsSchema,
  organizationsPaginationQuerySchema,
  updateOrganizationSchema,
  uploadOrganizationCrestSchema,
  uploadOrganizationLetterheadSchema,
  uploadOrganizationLetterheadTemplateSchema,
  uploadOrganizationLogoSchema,
} from "./organizations.schemas";
import { updateOrganization } from "./update-organization";

export const registerOrganizationRoutes: FastifyPluginAsyncZodOpenApi = async (app) => {
  // Organization deletion remains out of scope for this change.
  app.post(
    "/",
    {
      schema: createOrganizationSchema,
      preValidation: async (request) => {
        if (String(request.headers["content-type"] ?? "").includes("multipart/form-data")) {
          request.body = normalizeMultipartTextFields(request.body) as never;
        }
      },
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const rawBody = request.body as MultipartRequestBody;

      const hasLetterheadUpload = hasOrganizationLetterheadUpload(rawBody);

      if (
        (rawBody.letterhead != null && !isMultipartFileValue(rawBody.letterhead)) ||
        (hasLetterheadUpload && !isMultipartFileValue(rawBody.letterhead))
      ) {
        throw app.httpErrors.badRequest("Envie exatamente um arquivo de timbre.");
      }

      const letterheadFile = hasLetterheadUpload
        ? await normalizeLetterheadUpload({
            body: rawBody,
            maxDocxBytes: app.config.ORGANIZATION_LETTERHEAD_TEMPLATE_MAX_BYTES,
            maxImageBytes: app.config.SUPPORT_IMAGE_MAX_BYTES,
          })
        : undefined;

      const organization = await createOrganization({
        actor,
        db: app.db,
        letterheadFile,
        organization: request.body,
        storage: app.storage,
      });

      return reply.status(201).send(organization);
    },
  );

  app.get(
    "/",
    {
      schema: getOrganizationsSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const query = organizationsPaginationQuerySchema.parse(request.query);

      return getOrganizations({
        actor,
        db: app.db,
        page: query.page,
        pageSize: query.pageSize,
      });
    },
  );

  app.get(
    "/me",
    {
      schema: getCurrentOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);

      return getCurrentOrganization({ actor, db: app.db });
    },
  );

  app.get(
    "/:organizationId",
    {
      schema: getOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;

      return getOrganization({ actor, db: app.db, organizationId });
    },
  );

  app.post(
    "/:organizationId/letterhead",
    {
      schema: uploadOrganizationLetterheadSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const organization = await uploadOrganizationLetterhead({
        actor,
        body: request.body as Record<string, unknown> | undefined,
        db: app.db,
        maxDocxBytes: app.config.ORGANIZATION_LETTERHEAD_TEMPLATE_MAX_BYTES,
        maxImageBytes: app.config.SUPPORT_IMAGE_MAX_BYTES,
        organizationId,
        storage: app.storage,
      });

      return reply.status(201).send(organization);
    },
  );

  app.post(
    "/:organizationId/logo",
    {
      schema: uploadOrganizationLogoSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const organization = await uploadOrganizationAsset({
        actor,
        assetKind: "logo",
        body: request.body as Record<string, unknown> | undefined,
        db: app.db,
        maxBytes: app.config.ORGANIZATION_VISUAL_ASSET_MAX_BYTES,
        organizationId,
        storage: app.storage,
      });

      return reply.status(201).send(organization);
    },
  );

  app.post(
    "/:organizationId/crest",
    {
      schema: uploadOrganizationCrestSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const organization = await uploadOrganizationAsset({
        actor,
        assetKind: "crest",
        body: request.body as Record<string, unknown> | undefined,
        db: app.db,
        maxBytes: app.config.ORGANIZATION_VISUAL_ASSET_MAX_BYTES,
        organizationId,
        storage: app.storage,
      });

      return reply.status(201).send(organization);
    },
  );

  app.post(
    "/:organizationId/letterhead-template",
    {
      schema: uploadOrganizationLetterheadTemplateSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const organization = await uploadOrganizationAsset({
        actor,
        assetKind: "letterhead-template",
        body: request.body as Record<string, unknown> | undefined,
        db: app.db,
        maxBytes: app.config.ORGANIZATION_LETTERHEAD_TEMPLATE_MAX_BYTES,
        organizationId,
        storage: app.storage,
      });

      return reply.status(201).send(organization);
    },
  );

  app.get(
    "/:organizationId/letterhead/image",
    {
      schema: getOrganizationLetterheadImageSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;
      const letterhead = await getOrganizationLetterheadImage({
        actor,
        db: app.db,
        organizationId,
      });
      const storedObject = await app.storage.getObject({ key: letterhead.storageKey });

      if (storedObject.contentLength != null) {
        reply.header("content-length", String(storedObject.contentLength));
      }

      reply.header("cache-control", "private, max-age=300");
      reply.header(
        "content-disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(letterhead.fileName)}`,
      );

      return reply
        .type(storedObject.contentType ?? "application/octet-stream")
        .send(storedObject.body);
    },
  );

  const sendOrganizationAsset = async ({
    actor,
    assetKind,
    organizationId,
    reply,
  }: {
    actor: Actor;
    assetKind: "crest" | "letterhead-template" | "logo";
    organizationId: string;
    reply: FastifyReply;
  }) => {
    const asset = await getOrganizationAssetFile({
      actor,
      assetKind,
      db: app.db,
      organizationId,
    });
    const storedObject = await app.storage.getObject({ key: asset.storageKey });

    if (storedObject.contentLength != null) {
      reply.header("content-length", String(storedObject.contentLength));
    }

    reply.header("cache-control", "private, max-age=300");
    reply.header(
      "content-disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`,
    );

    return reply
      .type(storedObject.contentType ?? "application/octet-stream")
      .send(storedObject.body);
  };

  app.get(
    "/:organizationId/logo/file",
    {
      schema: getOrganizationAssetFileSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);

      return sendOrganizationAsset({
        actor,
        assetKind: "logo",
        organizationId: request.params.organizationId,
        reply,
      });
    },
  );

  app.get(
    "/:organizationId/crest/file",
    {
      schema: getOrganizationAssetFileSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);

      return sendOrganizationAsset({
        actor,
        assetKind: "crest",
        organizationId: request.params.organizationId,
        reply,
      });
    },
  );

  app.get(
    "/:organizationId/letterhead-template/file",
    {
      schema: getOrganizationAssetFileSchema,
    },
    async (request, reply) => {
      const actor = await getSessionUser(request);

      return sendOrganizationAsset({
        actor,
        assetKind: "letterhead-template",
        organizationId: request.params.organizationId,
        reply,
      });
    },
  );

  app.patch(
    "/:organizationId",
    {
      schema: updateOrganizationSchema,
    },
    async (request) => {
      const actor = await getSessionUser(request);
      const { organizationId } = request.params;

      return updateOrganization({
        actor,
        db: app.db,
        organizationId,
        changes: request.body,
      });
    },
  );
};
