import assert from "node:assert/strict";
import { test } from "vitest";
import {
  conflictErrorResponseSchema,
  internalServerErrorResponseSchema,
  pickErrorResponses,
  status400ErrorResponseSchema,
  validationErrorResponseSchema,
} from "./errors";

test("shared HTTP error schemas match the normalized backend envelopes", () => {
  assert.deepEqual(
    validationErrorResponseSchema.parse({
      error: "validation_error",
      message: "Validation failed",
      details: [{ path: ["name"], message: "Required" }],
    }),
    {
      error: "validation_error",
      message: "Validation failed",
      details: [{ path: ["name"], message: "Required" }],
    },
  );

  assert.deepEqual(
    status400ErrorResponseSchema.parse({
      error: "bad_request",
      message: "Organization id is required.",
      details: null,
    }),
    {
      error: "bad_request",
      message: "Organization id is required.",
      details: null,
    },
  );

  assert.deepEqual(
    conflictErrorResponseSchema.parse({
      error: "conflict",
      message: "Department slug is already in use for this organization.",
      details: null,
    }),
    {
      error: "conflict",
      message: "Department slug is already in use for this organization.",
      details: null,
    },
  );

  assert.deepEqual(
    internalServerErrorResponseSchema.parse({
      error: "internal_server_error",
      message: "An unexpected error occurred.",
    }),
    {
      error: "internal_server_error",
      message: "An unexpected error occurred.",
    },
  );
});

test("pickErrorResponses exposes only the requested documented statuses", () => {
  const responses = pickErrorResponses(400, 401, 409, 500);

  assert.deepEqual(Object.keys(responses), ["400", "401", "409", "500"]);
  assert.equal("403" in responses, false);
});
