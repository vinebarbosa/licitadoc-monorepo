## ADDED Requirements

### Requirement: Local S3 emulator uses MiniStack
The local development stack MUST use MiniStack as the S3-compatible emulator for object storage while preserving the existing API endpoint contract.

#### Scenario: MiniStack serves the configured S3 endpoint
- **WHEN** a developer starts the local object-storage service
- **THEN** MiniStack listens on `http://localhost:4566`
- **AND** the API can continue using `STORAGE_S3_ENDPOINT=http://localhost:4566`

#### Scenario: LocalStack service is no longer required
- **WHEN** a developer follows the local setup documentation
- **THEN** the documented Docker Compose service for object storage is MiniStack
- **AND** LocalStack is not required to run the API storage flows locally

### Requirement: Development bucket is bootstrapped
The local development stack MUST create the configured storage bucket idempotently during startup.

#### Scenario: Bucket missing at startup
- **WHEN** MiniStack starts and the `licitadoc-expense-requests` bucket does not exist
- **THEN** the stack creates the bucket before local storage verification is considered ready

#### Scenario: Bucket already exists at startup
- **WHEN** MiniStack starts and the `licitadoc-expense-requests` bucket already exists
- **THEN** startup continues without failing or deleting existing objects

### Requirement: Local S3 data is persistent across normal restarts
The local development stack MUST configure MiniStack persistence so bucket metadata and S3 object bytes survive normal container restarts.

#### Scenario: Object survives restart
- **WHEN** a developer uploads an object to the local storage bucket and restarts the MiniStack container without deleting volumes
- **THEN** the bucket remains available
- **AND** the uploaded object remains retrievable through the API storage provider

#### Scenario: Explicit volume reset loses local objects
- **WHEN** a developer deletes the MiniStack storage volumes or mounted data directories
- **THEN** the local objects may be lost
- **AND** the documentation explains that affected local database references must be re-seeded, re-uploaded, or reset

### Requirement: Documentation reflects MiniStack workflow
The project documentation and local seed instructions MUST reference MiniStack for object-storage setup.

#### Scenario: Developer follows SD upload seed docs
- **WHEN** a developer reads the SD upload seed setup
- **THEN** the command starts `postgres` and `ministack`
- **AND** the instructions do not refer to `localstack` as the required local object-storage service

#### Scenario: Developer diagnoses missing local assets
- **WHEN** a developer encounters missing local storage objects after migration
- **THEN** the documentation provides a clear recovery path for recreating the bucket and re-seeding or re-uploading local assets

### Requirement: Storage verification covers MiniStack
The implementation MUST include a focused verification path proving that the configured local MiniStack service supports the storage operations used by the API.

#### Scenario: Storage provider round trip
- **WHEN** the local MiniStack service is running
- **THEN** verification can create or confirm the configured bucket, write an object, read it back, and delete it using the API's S3-compatible storage configuration

#### Scenario: Verification failure is actionable
- **WHEN** the local storage verification fails because the bucket or emulator is unavailable
- **THEN** the failure output identifies the storage endpoint and bucket involved
