## Why

Local object storage is currently backed by LocalStack, and the development stack can lose the S3 bucket used by uploaded PDFs, support images, and organization letterheads, producing `NoSuchBucket` errors while the database still references stored objects. We should move the local S3-compatible emulator to MiniStack and make bucket initialization explicit so local development remains free, predictable, and resilient after restarts.

## What Changes

- Replace the `localstack` Docker Compose service with a MiniStack service that keeps the existing `http://localhost:4566` S3 endpoint contract.
- Preserve the current API storage environment defaults where possible: endpoint, region, bucket name, test credentials, and path-style access.
- Add a deterministic bucket bootstrap path for `licitadoc-expense-requests` so the local stack is ready before API reads and writes depend on it.
- Update local development documentation and seed instructions to reference MiniStack instead of LocalStack.
- Add verification for the S3-compatible storage provider against the MiniStack-backed local service or a focused setup check.
- Do not change production storage behavior or the API storage abstraction.

## Capabilities

### New Capabilities

- `local-object-storage-emulator`: Covers the local S3-compatible emulator, bucket bootstrap, persistence expectations, and developer setup documentation.

### Modified Capabilities

- None.

## Impact

- Affected infrastructure/config: `docker-compose.yml`, local object-storage volumes, and any local init scripts used to create buckets.
- Affected documentation/scripts: `README.md`, API seed messages, and any setup notes that mention `localstack`.
- Affected API behavior: no production API contract changes; local development should continue using the existing S3-compatible storage provider.
- Affected risk: existing local database rows may reference objects lost from the old LocalStack volume; migration should include a clear reset or re-seed path for letterheads and uploaded files.
