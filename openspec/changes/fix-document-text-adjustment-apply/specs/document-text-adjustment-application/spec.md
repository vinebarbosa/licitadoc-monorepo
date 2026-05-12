## ADDED Requirements

### Requirement: Text adjustment suggestions MUST include a validated source target
The system MUST resolve selected preview text to an unambiguous target in the current Markdown draft before returning a text-adjustment suggestion.

#### Scenario: Rendered administrative field selection resolves to Markdown source
- **WHEN** an authorized user requests an adjustment for rendered text selected from administrative fields or list items in a completed document preview
- **THEN** the suggestion response includes a source-content hash and a source target that identifies the corresponding Markdown source range

#### Scenario: Unresolvable selected text is rejected before apply
- **WHEN** the selected preview text cannot be mapped to exactly one target in the current Markdown draft
- **THEN** the system rejects the suggestion request with a validation or conflict error and leaves the stored draft content unchanged

### Requirement: Accepted text adjustments MUST apply by validated source target
The system MUST persist an accepted text-adjustment replacement only when the submitted source target still matches the current document draft and the source-content hash is current.

#### Scenario: Accepted suggestion replaces only the resolved target
- **WHEN** an authorized user applies a suggestion whose source-content hash and source target match the current draft
- **THEN** the backend replaces only that source range with the accepted replacement and returns the updated document detail

#### Scenario: Stale or mismatched source target is rejected
- **WHEN** an apply request references an old source-content hash or a source target whose text no longer matches the current draft
- **THEN** the system rejects the request and leaves the stored draft content unchanged

### Requirement: Text adjustment HTTP failures MUST be handled as UI errors
The document preview MUST treat non-2xx suggestion and apply responses as mutation failures, not successful adjustments.

#### Scenario: Apply conflict shows an error instead of success
- **WHEN** the apply endpoint returns a conflict response for an accepted text-adjustment suggestion
- **THEN** the preview shows the error message, does not show a success toast, and does not clear the selected adjustment panel as if the change succeeded

#### Scenario: Successful apply updates the visible preview from persisted content
- **WHEN** the apply endpoint returns an updated document detail after persisting the replacement
- **THEN** the preview updates to show the returned draft content and clears the adjustment panel
