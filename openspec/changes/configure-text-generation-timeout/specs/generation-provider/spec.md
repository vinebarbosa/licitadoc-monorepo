## MODIFIED Requirements

### Requirement: The active generation provider MUST be selected by runtime configuration
The system MUST resolve the active generation provider from runtime configuration instead of hard-coding a vendor inside document services. The system MUST also allow runtime configuration to set the provider request timeout used for text generation calls. If the configured provider is unsupported or incomplete, or the configured timeout is invalid, the system MUST fail in a controlled way rather than attempting an undefined provider call.

#### Scenario: Runtime configuration selects the active provider
- **WHEN** runtime configuration sets the active generation provider to a supported provider key
- **THEN** the system routes document-generation requests through the matching provider adapter

#### Scenario: Runtime configuration references an unsupported provider
- **WHEN** runtime configuration points to a provider key that the application does not support
- **THEN** the system fails in a controlled way before document generation can proceed

#### Scenario: Runtime configuration sets the provider timeout
- **WHEN** runtime configuration sets a valid text generation timeout value
- **THEN** the system applies that timeout to supported provider requests before aborting them as timed out

#### Scenario: Runtime configuration omits the provider timeout
- **WHEN** runtime configuration does not set a text generation timeout value
- **THEN** the system uses the provider adapter's existing default timeout behavior

#### Scenario: Runtime configuration provides an invalid provider timeout
- **WHEN** runtime configuration sets a non-positive or non-numeric text generation timeout value
- **THEN** the system fails configuration validation before document generation can proceed
