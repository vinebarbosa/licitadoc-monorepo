## Context

LicitaDoc uses an S3-compatible storage provider for development and production-like flows that store uploaded SD PDFs, support-ticket images, and organization letterheads. The local stack currently uses LocalStack at `http://localhost:4566` with bucket name `licitadoc-expense-requests`.

The API storage provider already creates the bucket before write operations, but read paths such as organization letterhead retrieval assume the bucket and object still exist. When the local emulator loses state while the database remains intact, the API can hit `NoSuchBucket` on reads and return 500 for assets referenced by database rows. The immediate production code does not need a new storage abstraction; the problem is local emulator setup and durable local bucket state.

## Goals / Non-Goals

**Goals:**

- Replace the local LocalStack service with MiniStack while preserving the existing S3 endpoint contract used by the API.
- Enable durable local S3 state for the development bucket so uploaded objects survive normal container restarts.
- Create the configured bucket deterministically at stack startup.
- Update developer docs and seed output so local commands reference MiniStack.
- Add a focused verification path that proves the bucket exists and the API storage provider can write/read against the local emulator.

**Non-Goals:**

- Change production S3 configuration or cloud deployment behavior.
- Rewrite the API storage provider away from the existing S3-compatible adapter.
- Preserve objects already lost from an old LocalStack container.
- Introduce public bucket access or weaken authenticated asset routes.

## Decisions

### Decision 1: Keep the S3 endpoint and API environment stable

MiniStack will run on port `4566`, so `STORAGE_S3_ENDPOINT=http://localhost:4566`, region, credentials, bucket name, and path-style access can remain unchanged. This limits the migration to infrastructure, docs, and local bootstrap scripts.

Alternative considered: move to MinIO or another S3 server on a different port. That would work for object storage, but it is less aligned with the user's request and would require more endpoint/documentation churn.

### Decision 2: Use explicit MiniStack persistence for both service state and S3 object bytes

The Compose service should set MiniStack persistence variables for metadata and S3 objects and mount durable volumes/directories for `STATE_DIR` and `S3_DATA_DIR`. This matters because MiniStack treats service state and S3 object bytes as separate persistence layers.

Alternative considered: rely only on bucket bootstrap and accept ephemeral objects. That would reduce configuration but would still break letterhead and uploaded-file reads after restarts while the database remains persistent.

### Decision 3: Bootstrap the bucket through a MiniStack-compatible ready script

Add a small executable init/ready script mounted into MiniStack's LocalStack-compatible init path. The script should idempotently create `licitadoc-expense-requests` if it does not exist. This keeps local setup self-healing and avoids requiring developers to remember an AWS CLI command before starting the API.

Alternative considered: rely only on `S3FileStorageProvider.ensureBucket()`. That covers writes, but read-only paths can still fail when a database row references storage before any write operation recreates the bucket.

### Decision 4: Treat existing broken local references as a reseed/reset problem

If the old LocalStack bucket state is already gone, database rows may point to missing letterhead or uploaded objects. The implementation should document a clean recovery path: recreate the bucket, rerun the relevant seed/upload path for the Pureza letterhead, or reset affected local rows. It should not attempt to infer or restore missing object bytes from the database.

Alternative considered: swallow `NoSuchBucket` as a 404 everywhere. That may be useful as defensive hardening later, but it does not solve local persistence and could hide real storage drift.

## Risks / Trade-offs

- [Risk] MiniStack S3 behavior may differ from LocalStack in edge cases. -> Keep usage to common S3 operations already used by the app: `HeadBucket`, `CreateBucket`, `PutObject`, `GetObject`, and `DeleteObject`.
- [Risk] Existing LocalStack volume data will not automatically migrate. -> Document the migration as a local reset/reseed and keep old objects out of scope unless manually exported before the switch.
- [Risk] A floating `latest` image can change behavior unexpectedly. -> Prefer a pinned MiniStack image tag during implementation, with an intentional update path.
- [Risk] The ready script may run asynchronously after the API starts. -> Use the MiniStack readiness endpoint or document that `docker compose up -d postgres ministack` should wait for health before starting `api:dev`; the script must be idempotent either way.

## Migration Plan

1. Replace the `localstack` Compose service with `ministack`, preserving port `4566`.
2. Add MiniStack persistence environment and storage mounts for service state and S3 object bytes.
3. Add an idempotent bucket creation script mounted into MiniStack's ready init directory.
4. Update README and seed script messages from `localstack` to `ministack`.
5. Run the local stack, verify bucket bootstrap, and exercise a storage read/write path.
6. For developers with stale local DB rows, document re-seeding or re-uploading letterhead assets.

Rollback: restore the previous `localstack` service in Compose and docs. API environment variables do not need rollback because the endpoint contract remains unchanged.

## Open Questions

- Resolved during implementation: pin the Compose service to `ministackorg/ministack:1.3`.
- Defensive API handling for missing letterhead objects remains out of scope for this change; this change fixes the local emulator persistence and bootstrap path.
