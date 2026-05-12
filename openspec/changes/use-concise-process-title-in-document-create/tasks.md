## 1. Picker Label Implementation

- [x] 1.1 Import or otherwise reuse the existing concise process display helper in `DocumentCreatePageUI`.
- [x] 1.2 Update the process picker option content to render process number plus concise display title instead of the full process object.
- [x] 1.3 Ensure the selected trigger remains readable for URL-preselected processes and truncates long labels without horizontal overflow.

## 2. Fallbacks and Behavior Preservation

- [x] 2.1 Confirm picker items with missing or blank `title` fall back to an object-derived or process-number label.
- [x] 2.2 Preserve the existing generated document name format based on document type and process number.
- [x] 2.3 Leave document creation API payloads unchanged.

## 3. Tests and Validation

- [x] 3.1 Update document creation page tests to expect concise process titles in picker options and URL-preselected trigger text.
- [x] 3.2 Add or update a fallback test for process picker items without a usable title.
- [x] 3.3 Run the relevant web tests and typecheck for the document creation flow.
