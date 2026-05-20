## 1. Shared Upload Pattern

- [ ] 1.1 Decide whether the two target flows should use a new `FileUploadField` shared component or a small local helper, based on duplication in implementation.
- [ ] 1.2 Implement the upload pattern with a visually hidden native file input, PT-BR visible labels/actions, lucide iconography, selected-file metadata, remove action, disabled/error states, and focus styling from existing tokens.
- [ ] 1.3 Ensure the control uses stable dimensions and responsive wrapping so long file names do not overflow on mobile or desktop.

## 2. SD Import Dialog

- [ ] 2.1 Replace the visible native PDF input in `sd-import-dialog.tsx` with the custom upload UI.
- [ ] 2.2 Keep the SD PDF input accessible by a PT-BR label and preserve `accept="application/pdf,.pdf"` plus the existing file-reading behavior.
- [ ] 2.3 Verify loading, extraction preview, warning, error, cancel, and apply states still render in PT-BR and fit within the dialog.

## 3. Letterhead Onboarding Upload

- [ ] 3.1 Replace the visible native letterhead input in `onboarding-views.tsx` with the same custom upload pattern or compatible variant.
- [ ] 3.2 Preserve accepted image types, 5 MB guidance, selected file display, localized file size, remove action, and validation error rendering.
- [ ] 3.3 Adjust the layout so the section reads as one polished upload area rather than a dashed card plus a separate browser input.

## 4. Tests And Validation

- [ ] 4.1 Update process creation tests that select "Arquivo PDF da SD" to work with the new accessible upload control.
- [ ] 4.2 Update onboarding tests that select and remove "Papel timbrado da organização" to work with the new accessible upload control.
- [ ] 4.3 Run focused web tests for process creation and owner onboarding.
- [ ] 4.4 Run a visual check of the affected screens to confirm no "Choose File" or other English browser-native upload copy remains visible.
