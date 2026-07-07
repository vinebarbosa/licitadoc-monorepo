## ADDED Requirements

### Requirement: Generation providers MUST advertise direct Tiptap JSON capability
Each generation provider adapter MUST expose whether it supports direct constrained Tiptap JSON output for document generation. The document-generation workflow MUST use that capability signal before routing direct-json generation requests.

#### Scenario: Provider supports direct Tiptap JSON
- **WHEN** runtime configuration selects a provider that advertises direct Tiptap JSON support
- **THEN** the document-generation workflow may route direct-json generation requests through that provider

#### Scenario: Provider lacks direct Tiptap JSON support
- **WHEN** runtime configuration selects a provider that does not advertise direct Tiptap JSON support
- **THEN** the document-generation workflow fails or falls back only through an explicitly configured compatibility path

## MODIFIED Requirements

### Requirement: Document generation MUST execute through a provider-agnostic generation contract
The system MUST invoke document generation through a shared provider contract that accepts normalized generation input and returns normalized generation output, independent of the underlying vendor implementation. For direct-json document generation, the shared provider contract MUST support requesting constrained Tiptap JSON output and returning the provider response as parseable JSON text or a normalized structured payload.

#### Scenario: OpenAI-backed adapter satisfies the shared contract
- **WHEN** the active generation provider is configured to use an OpenAI-backed adapter for direct-json generation
- **THEN** the document-generation workflow invokes that adapter through the shared provider contract and receives normalized constrained Tiptap JSON output without vendor-specific branching in the document module

### Requirement: The active generation provider MUST be selected by runtime configuration
The system MUST resolve the active generation provider from runtime configuration instead of hard-coding a vendor inside document services. If the configured provider is unsupported, incomplete, or does not support the required direct Tiptap JSON capability, the system MUST fail in a controlled way rather than attempting an undefined provider call.

#### Scenario: Runtime configuration selects the active provider
- **WHEN** runtime configuration sets the active generation provider to a supported provider key with direct Tiptap JSON capability
- **THEN** the system routes document-generation requests through the matching provider adapter

#### Scenario: Runtime configuration references an unsupported provider
- **WHEN** runtime configuration points to a provider key that the application does not support or that lacks required direct Tiptap JSON capability
- **THEN** the system fails in a controlled way before document generation can proceed

### Requirement: Provider executions MUST record generic metadata and normalized failures
The system MUST persist generation execution metadata using generic fields such as `providerKey`, `model`, output format, validation status, and token/cost data when available, and it MUST normalize provider failures into application-level error categories that the document workflow can store and surface consistently.

#### Scenario: Successful provider execution records generic metadata
- **WHEN** a provider successfully returns valid constrained Tiptap JSON for generated draft content
- **THEN** the system records the execution using generic metadata fields for the provider key, model, requested output format, and validation status

#### Scenario: Provider timeout or rate-limit failure is normalized
- **WHEN** the provider fails because of a timeout, rate limit, authentication issue, or unsupported direct-json capability
- **THEN** the system stores a normalized failure record instead of leaking the raw vendor error shape into the document workflow
