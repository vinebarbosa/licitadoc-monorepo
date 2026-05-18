## ADDED Requirements

### Requirement: Document generation MUST support a Humanization Pass before review
The document-generation pipeline MUST run a Humanization Pass after the Writer stage and before structured review when pipeline state is available. The pass MUST produce a draft candidate for review without changing the public create-document API.

#### Scenario: Pipeline humanizes writer draft before review
- **WHEN** an authorized actor requests generation of an ETP, TR, DFD, or Minuta for a stored process
- **THEN** the system writes the initial draft
- **AND** the system runs the Humanization Pass before the reviewer evaluates the draft
- **AND** the reviewer evaluates the humanized draft rather than the unrefined writer draft

#### Scenario: Legacy fallback still generates
- **WHEN** a generation run lacks stored pipeline state or cannot run the Humanization Pass
- **THEN** the system can fall back to the existing writer/reviewer path
- **AND** the public document-generation request remains compatible

### Requirement: Document generation debug trace MUST include humanization when requested
When debug output is requested, the pipeline debug trace MUST include enough information to inspect the humanization stage, including the writer draft and humanized draft or a clear indication that the pass was skipped. Default user-facing responses MUST NOT expose this trace.

#### Scenario: Debug trace includes humanization details
- **WHEN** an authorized actor requests document generation with debug enabled
- **THEN** the debug trace includes the writer draft, humanization result or skipped status, reviewer result, rewrite attempts, and final draft

#### Scenario: Default response hides humanization details
- **WHEN** an authorized actor generates a document without debug enabled
- **THEN** the response does not include writer drafts, humanization drafts, reviewer issues, or internal style metadata

### Requirement: Reviewer schema MUST include visible-AI issue types
The structured document review schema MUST support `meta_language` and `excessive_defensiveness` issue types in addition to the existing review taxonomy.

#### Scenario: Review result validates meta-language issue
- **WHEN** the reviewer detects language that exposes pipeline caution or missing-context mechanics
- **THEN** it can return a valid issue with type `meta_language`

#### Scenario: Review result validates excessive-defensiveness issue
- **WHEN** the reviewer detects over-cautious institutional prose that makes the document read like an AI safety explanation
- **THEN** it can return a valid issue with type `excessive_defensiveness`

### Requirement: Writer style MUST be derived during generation
The generation pipeline MUST derive a writer style from document type and enriched classification, and MUST pass that style to Writer, Humanization Pass, Reviewer, and debug trace when available.

#### Scenario: Style is available to pipeline stages
- **WHEN** enriched context and document plan are created for a generation request
- **THEN** the pipeline derives a writer style for that request
- **AND** writer, humanizer, and reviewer receive the selected style as generation guidance

#### Scenario: Style derivation does not replace document plan
- **WHEN** a writer style is selected
- **THEN** the system still uses the existing document plan for depth, focus areas, avoid rules, and generation hints

### Requirement: Final output MUST avoid visible safety explanations
Generated documents MUST handle missing data, zero values, placeholders, and unsupported claims without repeatedly explaining the safety mechanism in the final prose.

#### Scenario: Zero value remains safe but natural
- **WHEN** an SD includes `0`, `0,00`, `0.00`, or `R$ 0,00` as value evidence
- **THEN** the final document does not treat zero as a valid price
- **AND** the final document uses placeholders or concise institutional wording instead of repeated explanations about missing context

#### Scenario: Missing optional data is not over-explained
- **WHEN** optional data such as supplier, detailed budget, signature date, or precise location is absent
- **THEN** the final document uses the appropriate placeholder or omits the detail according to document type
- **AND** it does not repeatedly state that the context lacks the data
