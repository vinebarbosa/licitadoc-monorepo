## ADDED Requirements

### Requirement: LicitaDoc document AST MUST define a constrained document structure
The system MUST define a versioned LicitaDoc document AST for procurement documents. The AST MUST support only approved document block types, approved inline marks, document type metadata, and structural attributes needed by editor, preview, compatibility text, and DOCX export.

#### Scenario: AST validates approved block structure
- **WHEN** generated structured content contains approved blocks such as headings, paragraphs, lists, tables, page breaks, clauses, placeholders, and signature blocks
- **THEN** the system accepts the AST as valid structured document content

#### Scenario: AST rejects unsupported structure
- **WHEN** generated structured content contains raw HTML, scriptable content, unknown block kinds, unknown marks, or unsupported attributes
- **THEN** the system rejects the AST instead of persisting it as document content

### Requirement: AST validation MUST be enforced before persistence
The system MUST validate generated or normalized AST content before storing it as the structured source for a document. Invalid AST content MUST NOT update the completed document body.

#### Scenario: Provider returns malformed structured output
- **WHEN** the generation provider returns malformed JSON or AST content that fails validation
- **THEN** the generation pipeline does not persist that invalid content as the completed document

#### Scenario: Editor save normalizes to valid AST
- **WHEN** a completed document is saved from supported editor JSON
- **THEN** the backend normalizes the editor content to valid AST before updating the stored structured document

### Requirement: AST converters MUST produce editor and text projections
The system MUST provide deterministic converters from valid AST to Tiptap JSON and compatibility text. These projections MUST be derived from the same AST source so editor, preview, text hashes, and export behavior do not diverge.

#### Scenario: AST converts to editable Tiptap JSON
- **WHEN** a completed document has valid AST content
- **THEN** the system can derive Tiptap JSON that preserves headings, paragraphs, inline marks, lists, tables where supported, alignment, indentation, page breaks, and signature blocks

#### Scenario: AST converts to compatibility text
- **WHEN** a completed document has valid AST content
- **THEN** the system can derive non-empty compatibility text suitable for existing text reads, hashes, and text-adjustment flows

### Requirement: Legacy documents MUST be convertible into structured content for read and export
The system MUST support deriving structured content for completed legacy documents that do not yet have persisted AST. The fallback MUST prefer existing Tiptap JSON when valid and then fall back to text conversion from `draftContent`.

#### Scenario: Legacy document has Tiptap JSON only
- **WHEN** a completed document has valid `draftContentJson` but no persisted AST
- **THEN** the system derives AST from the Tiptap JSON for preview, save normalization, and export behavior

#### Scenario: Legacy document has text only
- **WHEN** a completed document has `draftContent` but no valid structured JSON content
- **THEN** the system derives best-effort AST from the text content instead of requiring regeneration

### Requirement: AST MUST represent document-specific institutional blocks
The AST MUST include first-class representation for document structures that are important to LicitaDoc output, including signature blocks, placeholders, page breaks, and fixed contractual clauses where applicable.

#### Scenario: Signature block is structured
- **WHEN** a generated DFD, ETP, or TR includes closing date, responsible name, and role
- **THEN** the AST represents the closing as a structured signature block instead of relying on underscore lines or visual-only Markdown spacing

#### Scenario: Page break is structured
- **WHEN** a document contains a manual page break
- **THEN** the AST represents the page break as a structural block that can be rendered in Tiptap and converted to a DOCX page break
