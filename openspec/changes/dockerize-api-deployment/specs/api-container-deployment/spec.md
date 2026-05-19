## ADDED Requirements

### Requirement: Production API Container Image
The system SHALL provide a Docker build path that produces a production container image for `@licitadoc/api` from the monorepo source.

#### Scenario: Build image from repository root
- **WHEN** a maintainer builds the API image from the repository root using the documented Dockerfile
- **THEN** the build SHALL install dependencies from `pnpm-lock.yaml`, compile `@licitadoc/api`, and produce an image that can start the compiled API server

#### Scenario: Runtime image excludes development workflow
- **WHEN** the production image is created
- **THEN** the runtime stage SHALL contain only the runtime files and dependencies needed to start the compiled API, not the full development workspace

### Requirement: Container Runtime Configuration
The system SHALL configure the API container through runtime environment variables rather than secrets or deployment values baked into the image.

#### Scenario: Container starts on configured host and port
- **WHEN** the container starts with `HOST` and `PORT` environment variables
- **THEN** the API SHALL bind to the configured host and port

#### Scenario: Production services are configured at runtime
- **WHEN** the container is deployed to a production environment
- **THEN** database, auth, CORS, storage, text-generation, mail, and realtime settings SHALL be supplied through environment variables

#### Scenario: Image does not include local secrets
- **WHEN** the container image is built
- **THEN** `.env` files and deployment secrets SHALL NOT be copied into the image

### Requirement: Container Health Verification
The system SHALL provide a container-compatible health verification path for the API.

#### Scenario: Health endpoint responds in running container
- **WHEN** the API container is running and receives a request to `/health`
- **THEN** it SHALL return a successful response with status `ok`

#### Scenario: Host platform can check container health
- **WHEN** the image or deployment documentation defines a health check
- **THEN** the health check SHALL verify the running API through `/health`

### Requirement: Local Container Deployment Workflow
The system SHALL document and support a local workflow for building and running the API container against local dependencies.

#### Scenario: Maintainer runs API with local service dependencies
- **WHEN** a maintainer starts the local container workflow
- **THEN** the API SHALL be able to connect to the local Postgres and S3-compatible storage services using documented environment variables

#### Scenario: Maintainer verifies the image before external deployment
- **WHEN** a maintainer follows the local verification steps
- **THEN** they SHALL be able to build the image, start the container, call `/health`, and identify the command used to run database migrations separately

### Requirement: Deployment Documentation
The system SHALL document how to deploy the API image to a generic container host.

#### Scenario: Maintainer prepares a container-host deployment
- **WHEN** a maintainer reads the deployment documentation
- **THEN** the documentation SHALL identify the image build command, runtime start behavior, required environment variables, healthcheck path, migration step, and rollback strategy
