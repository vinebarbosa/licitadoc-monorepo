## MODIFIED Requirements

### Requirement: Provider executions MUST record generic metadata and normalized failures
The system MUST persist generation execution metadata using generic fields such as `providerKey` and `model`, and it MUST normalize provider failures into application-level error categories that the document workflow can store and surface consistently. For provider executions backed by a supported priced OpenAI model string or explicitly configured pricing alias, the system MUST record numeric cost metadata from normalized token usage while preserving the original model string in execution metadata. For unsupported or unpriced model strings, the system MUST leave cost metadata unset rather than estimating a price silently.

#### Scenario: Successful provider execution records generic metadata
- **WHEN** a provider successfully returns generated draft content
- **THEN** the system records the execution using generic metadata fields for the provider key and model

#### Scenario: OpenAI execution records cost for supported priced model alias
- **WHEN** the active OpenAI provider successfully returns normalized usage for a model string with configured pricing or an explicit pricing alias
- **THEN** the system records numeric cost metadata for the provider call and preserves the original model string used for the call

#### Scenario: OpenAI execution keeps cost unset for unpriced model
- **WHEN** the active OpenAI provider successfully returns normalized usage for a model string without configured pricing
- **THEN** the system records the normalized usage and leaves cost metadata unset

#### Scenario: Provider timeout or rate-limit failure is normalized
- **WHEN** the provider fails because of a timeout, rate limit, or authentication issue
- **THEN** the system stores a normalized failure record instead of leaking the raw vendor error shape into the document workflow
