## ADDED Requirements

### Requirement: Document generation MUST execute through a provider-agnostic generation contract
The system MUST invoke document generation through a shared provider contract that accepts normalized generation input and returns normalized generation output, independent of the underlying vendor implementation.

#### Scenario: OpenAI-backed adapter satisfies the shared contract
- **WHEN** the active generation provider is configured to use an OpenAI-backed adapter
- **THEN** the document-generation workflow invokes that adapter through the shared provider contract and receives normalized output without vendor-specific branching in the document module

### Requirement: The active generation provider MUST be selected by runtime configuration
The system MUST resolve the active generation provider from runtime configuration instead of hard-coding a vendor inside document services. If the configured provider is unsupported or incomplete, the system MUST fail in a controlled way rather than attempting an undefined provider call.

#### Scenario: Runtime configuration selects the active provider
- **WHEN** runtime configuration sets the active generation provider to a supported provider key
- **THEN** the system routes document-generation requests through the matching provider adapter

#### Scenario: Runtime configuration references an unsupported provider
- **WHEN** runtime configuration points to a provider key that the application does not support
- **THEN** the system fails in a controlled way before document generation can proceed

### Requirement: Provider executions MUST record generic metadata and normalized failures
The system MUST persist generation execution metadata using generic fields such as `providerKey` and `model`, and it MUST normalize provider failures into application-level error categories that the document workflow can store and surface consistently.

#### Scenario: Successful provider execution records generic metadata
- **WHEN** a provider successfully returns generated draft content
- **THEN** the system records the execution using generic metadata fields for the provider key and model

#### Scenario: Provider timeout or rate-limit failure is normalized
- **WHEN** the provider fails because of a timeout, rate limit, or authentication issue
- **THEN** the system stores a normalized failure record instead of leaking the raw vendor error shape into the document workflow
