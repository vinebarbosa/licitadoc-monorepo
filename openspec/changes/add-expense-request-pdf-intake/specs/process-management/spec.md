## ADDED Requirements

### Requirement: Processes imported from source files MUST preserve source-file traceability
The system MUST allow a stored process created from an imported source file to persist `sourceKind`, `sourceReference`, and structured `sourceMetadata` describing the imported file and intake warnings. That structured metadata MUST be readable with the process without exposing raw file bytes in process responses.

#### Scenario: Imported process detail includes source-file metadata
- **WHEN** an authorized actor reads a process that was created from an uploaded source PDF
- **THEN** the system returns the process profile together with source traceability metadata such as file name, content type, storage location, and intake warnings

#### Scenario: Directly created process omits source-file metadata
- **WHEN** an authorized actor reads a process that was created without an imported source file
- **THEN** the system may keep `sourceKind`, `sourceReference`, and `sourceMetadata` null without changing the rest of the process profile
