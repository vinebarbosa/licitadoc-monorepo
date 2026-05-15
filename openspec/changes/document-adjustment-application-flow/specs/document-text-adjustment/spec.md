## ADDED Requirements

### Requirement: Completed generated documents MUST support selected text adjustment suggestions
The system MUST allow authorized actors to request an AI-generated replacement for a selected trecho of a completed generated document. The request MUST include the selected text, the user's adjustment instruction, and optional selection context. The system MUST resolve the selected text to a single source target in the current draft before invoking the text generation provider.

#### Scenario: Suggest adjustment for a resolvable selection
- **WHEN** an authorized actor requests an adjustment suggestion for a selected trecho that resolves uniquely in a completed generated document
- **THEN** the system invokes the text generation provider with the selected trecho, nearby context, document type, and user instruction
- **AND** returns the replacement text, current source content hash, and resolved source target

#### Scenario: Reject ambiguous selected text
- **WHEN** an authorized actor requests an adjustment suggestion for selected text that appears in multiple indistinguishable source locations
- **THEN** the system rejects the request without invoking the provider
- **AND** returns an error explaining that the selected text could not be resolved unambiguously

#### Scenario: Reject adjustment for unavailable draft content
- **WHEN** an authorized actor requests an adjustment suggestion for a document that is not completed or has no draft content
- **THEN** the system rejects the request
- **AND** does not invoke the text generation provider

### Requirement: Document preview MUST show the selected trecho as a skeleton while adjustment is pending
The web preview MUST visually mark the active selected trecho inside the document body while an adjustment suggestion or apply request is pending. The visual treatment MUST appear as a neutral gray skeleton in the selected trecho location and MUST clear when the pending operation succeeds, fails, or is dismissed.

#### Scenario: Skeleton appears during suggestion generation
- **WHEN** the user selects text in a completed document preview, enters an adjustment instruction, and submits the request
- **THEN** the selected trecho in the document preview is replaced or overlaid with a gray skeleton while the suggestion request is pending
- **AND** the adjustment panel remains available to show progress or errors

#### Scenario: Skeleton remains during apply
- **WHEN** the user accepts an adjustment suggestion and the apply request is pending
- **THEN** the selected trecho remains visually marked as a gray skeleton until the apply request completes

#### Scenario: Skeleton clears on failure or dismissal
- **WHEN** the user dismisses the adjustment panel or the suggestion/apply request fails
- **THEN** the gray skeleton is removed from the document preview
- **AND** the original rendered document text is visible unless the apply succeeded

### Requirement: Applying an adjustment MUST persist the replacement and refresh the preview
The system MUST apply an accepted adjustment by replacing only the resolved source target in the current document `draftContent`. The apply request MUST include the source content hash and source target returned by the suggestion response. On success, the API MUST return the updated document and the web preview MUST render the updated content.

#### Scenario: Apply accepted adjustment successfully
- **WHEN** an authorized actor applies a suggestion with a matching source content hash and source target
- **THEN** the system replaces only that source target with the replacement text in the stored `draftContent`
- **AND** returns the updated document detail
- **AND** the web preview renders the replacement text after the request completes

#### Scenario: Reject stale adjustment apply
- **WHEN** an authorized actor applies a suggestion whose source content hash no longer matches the current document content
- **THEN** the system rejects the request with a conflict
- **AND** the stored draft content is not changed
- **AND** the web preview keeps the current document content visible after clearing the skeleton

#### Scenario: Reject mismatched source target
- **WHEN** an authorized actor applies a suggestion whose source target no longer matches the current source text
- **THEN** the system rejects the request with a conflict
- **AND** the stored draft content is not changed

### Requirement: Text adjustment controls MUST be scoped to authorized completed document previews
The web preview MUST expose the text adjustment prompt only when the current document is completed, has previewable draft content, and the actor can manage the document. Generating, failed, unavailable, or empty previews MUST NOT expose the adjustment prompt.

#### Scenario: Completed document exposes adjustment prompt
- **WHEN** an authorized actor selects text in a completed document preview with draft content
- **THEN** the web preview displays the adjustment prompt for the selected trecho

#### Scenario: Generating document hides adjustment prompt
- **WHEN** the document preview is still generating
- **THEN** selecting visible preview text does not display the adjustment prompt
