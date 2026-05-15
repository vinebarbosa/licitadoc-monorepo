## ADDED Requirements

### Requirement: Adjustment selection resolution MUST understand rendered text and Markdown structure
The system SHALL resolve selected preview text to exactly one Markdown source target using rendered-text projection, source offsets, selection context, and Markdown block structure before invoking the text-generation provider.

#### Scenario: Uppercase rendered paragraph resolves to source paragraph
- **WHEN** an authorized actor requests an adjustment for selected preview text whose casing differs from the stored Markdown paragraph but whose prefix and suffix context identify one section body
- **THEN** the system resolves the selection to that paragraph's Markdown source target without returning a conflict
- **AND** the system does not include the preceding heading in the source target when the selected text did not include that heading

#### Scenario: Heading context anchors body-only selection
- **WHEN** the selected text is a section body and the selection context prefix ends with the rendered section heading
- **THEN** the system uses the heading as context for disambiguation
- **AND** the replacement target remains scoped to the selected body text

#### Scenario: Ambiguous rendered match is rejected
- **WHEN** normalized rendered matching finds multiple possible source targets and selection context does not identify one target
- **THEN** the system rejects the suggestion request before invoking the provider
- **AND** the stored draft content remains unchanged

### Requirement: Adjustment prompts MUST include structure-aware context
The system SHALL provide the text-generation provider with enough context to preserve Markdown formatting, including selected rendered text, selected source Markdown, nearby Markdown boundaries, and a compact description of the selected block structure.

#### Scenario: Provider receives selected Markdown source
- **WHEN** an authorized actor requests an adjustment suggestion for a resolved selection
- **THEN** the provider prompt includes the selected text as shown to the user
- **AND** the prompt includes the exact Markdown source that will be replaced
- **AND** the prompt identifies whether the target is a paragraph, heading, list item, heading-plus-body block, or other supported block shape

#### Scenario: Body paragraph instruction preserves section heading
- **WHEN** the selected source target is a paragraph under a section heading and the user instruction asks for the text to be a paragraph
- **THEN** the provider prompt instructs the model to return only replacement Markdown for the selected body
- **AND** the prompt instructs the model not to rewrite, duplicate, uppercase, or merge the surrounding section heading

#### Scenario: Heading-plus-body instruction preserves separation
- **WHEN** the selected source target includes a heading followed by body text
- **THEN** the provider prompt instructs the model to keep the heading line separate from the body unless the user explicitly asks to rename or remove the heading

### Requirement: Suggested replacements MUST preserve or validate document structure before return
The system SHALL normalize safe provider output and reject structurally unsafe output before returning an adjustment suggestion to the client.

#### Scenario: Single-line heading and body output is repaired
- **WHEN** the selected source target includes a heading and body, the user did not request heading changes, and the provider returns the heading and body merged into a single plain-text line
- **THEN** the system returns a suggestion that preserves the original heading as a Markdown heading line
- **AND** places the rewritten body in a separate paragraph

#### Scenario: Body-only replacement remains paragraph Markdown
- **WHEN** the selected source target is a paragraph body and the user asks for it to be a paragraph
- **THEN** the system returns replacement Markdown that can be persisted as paragraph content
- **AND** the replacement MUST NOT start a new heading or include the next section heading

#### Scenario: Unsafe replacement is rejected
- **WHEN** the provider output attempts to include unrelated adjacent sections, duplicate the next section heading, or otherwise rewrite outside the resolved source target
- **THEN** the system rejects the suggestion response
- **AND** no draft content is changed

### Requirement: Selection conflicts MUST provide actionable diagnostics
The system SHALL return conflict responses that distinguish unresolvable selections, ambiguous selections, and stale or mismatched context while keeping the current user-facing message safe for display.

#### Scenario: No source match diagnostic
- **WHEN** the selected text cannot be matched against source Markdown or rendered projection
- **THEN** the conflict response includes diagnostic details indicating that no source target was found

#### Scenario: Ambiguous match diagnostic
- **WHEN** the selected text matches more than one candidate after normalization
- **THEN** the conflict response includes diagnostic details indicating ambiguity and the number of candidates when available

#### Scenario: Context mismatch diagnostic
- **WHEN** the selected text matches source content but the supplied selection context does not align with any candidate
- **THEN** the conflict response includes diagnostic details indicating a context mismatch
