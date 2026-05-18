## 1. Compose And Persistence

- [x] 1.1 Replace the `localstack` service in `docker-compose.yml` with a `ministack` service using a pinned MiniStack image.
- [x] 1.2 Preserve port `4566` and S3-compatible path-style access for the existing API storage configuration.
- [x] 1.3 Configure MiniStack persistence for service state and S3 object bytes.
- [x] 1.4 Add durable volumes or mounted directories for MiniStack state and S3 object data.
- [x] 1.5 Update the object-storage healthcheck to use a MiniStack-compatible readiness or health endpoint.

## 2. Bucket Bootstrap

- [x] 2.1 Add an idempotent MiniStack init/ready script that creates `licitadoc-expense-requests` when missing.
- [x] 2.2 Ensure the bucket bootstrap succeeds when the bucket already exists without deleting existing objects.
- [x] 2.3 Document or encode the startup order so the API is run after MiniStack is healthy and ready.

## 3. Documentation And Seeds

- [x] 3.1 Update README local setup commands from `localstack` to `ministack`.
- [x] 3.2 Update API seed script console guidance that references `localstack`.
- [x] 3.3 Document the local recovery path for stale database rows that reference objects lost from the old LocalStack state.
- [x] 3.4 Confirm `apps/api/.env.example` remains correct for MiniStack or adjust only if the endpoint contract changes.

## 4. Verification

- [x] 4.1 Start `postgres` and `ministack` from Docker Compose and verify both become healthy.
- [x] 4.2 Verify the configured bucket exists after startup.
- [x] 4.3 Run a focused S3 round-trip against the API storage configuration: write, read, and delete an object.
- [x] 4.4 Run API typecheck or the smallest relevant API test target for storage-related changes.
- [x] 4.5 Run formatting/lint checks for changed infrastructure, script, and documentation files where applicable.
