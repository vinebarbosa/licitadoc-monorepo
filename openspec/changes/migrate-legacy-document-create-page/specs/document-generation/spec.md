## ADDED Requirements

### Requirement: Document generation requests MUST accept an optional custom document name
The system MUST allow authorized actors to provide an optional custom document name when requesting document generation. When the submitted name is non-empty after normalization, the created document MUST persist and expose that exact name. When the field is omitted or blank, the system MUST keep using the default generated name derived from the document type and process context.

#### Scenario: Actor creates a document with a custom name
- **WHEN** an authenticated actor submits a valid document-generation request with a non-empty custom name for a visible process
- **THEN** the system creates the generated document linked to that process and returns the persisted custom name in the create response

#### Scenario: Actor omits or blanks the custom name
- **WHEN** an authenticated actor submits a valid document-generation request without a custom name, or with a value that normalizes to empty text
- **THEN** the system creates the generated document using the default generated name derived from the requested document type and the target process