## Context

Organization onboarding already creates the prefeitura for an invited `organization_owner`, links the owner user to it, marks onboarding complete, and returns the serialized organization. A separate organization letterhead flow already validates image uploads, stores a single active letterhead per organization in object storage, and exposes the active letterhead through organization responses.

This change connects those flows so a new owner can provide the paper letterhead before entering the app. The letterhead remains optional, because many teams will not have the final image during first access.

## Goals / Non-Goals

**Goals:**

- Let the owner organization onboarding submission include one optional PNG, JPEG, or WebP letterhead file.
- Reuse the existing organization letterhead validation, storage key, authenticated image URL, and serializer shape.
- Keep onboarding completion valid when no letterhead is provided.
- Return the created organization with `letterhead` populated when upload succeeds.
- Add web UI affordances for choosing, previewing, removing, validating, and skipping the file.

**Non-Goals:**

- Changing how printed documents render letterhead.
- Adding multiple organization assets, version history, cropping, or image editing.
- Letting generic organization create/update payloads accept arbitrary letterhead URLs.
- Requiring a letterhead before the owner can enter the app.

## Decisions

### Decision 1: Extend onboarding as multipart when a file is present

The web onboarding client should submit organization fields and the optional file through the organization onboarding create route using `FormData`/multipart. Text-only onboarding continues to send the same fields, either through the same multipart route without a file or through backwards-compatible JSON parsing if the route keeps both content types.

Alternative considered: create a second post-creation upload call from the web after onboarding succeeds. That makes partial success easy: the user could enter the app with onboarding complete but no letterhead after a network/storage failure. Handling the file in the onboarding service keeps success/failure semantics explicit.

### Decision 2: Reuse the existing letterhead service after creating the organization

The onboarding handler should create the organization, then invoke the same lower-level letterhead storage/update helper used by organization letterhead management. The helper must receive the freshly created organization and authenticated actor context, then persist the active letterhead URL on that organization.

Alternative considered: duplicate MIME/size/storage validation inside onboarding. That would drift from the settings/admin upload path and make later limit changes error-prone.

### Decision 3: Treat letterhead upload failure as onboarding failure when a file was submitted

If the user attaches a file and the file fails validation or storage, the request should return an error and leave the user able to retry onboarding. If implementation cannot make database creation and storage fully atomic, persist database changes only after successful file validation/storage, or compensate by clearing/deleting partial records before returning the failure.

Alternative considered: complete onboarding and show a warning that the letterhead failed. That preserves account progress but silently drops an explicit setup action at the most important moment.

### Decision 4: Keep the UI optional and document-focused

The onboarding UI should present the letterhead as an optional official paper image, with file type/size feedback, image preview, remove action, loading state, and submit disabled only for invalid local file state. The form should avoid implying that generated document content changes; the asset is for print appearance.

Alternative considered: hide upload behind a later settings reminder. That is simpler, but it leaves the first generated/printed documents without institutional paper even when the owner already has the asset available.

## Risks / Trade-offs

- Multipart create route may affect generated client ergonomics -> Regenerate the API client and wrap the generated call behind the onboarding hook so UI code stays simple.
- Storage succeeds but database update fails -> Prefer deterministic keys plus transaction/compensation; retry should overwrite the same active object safely.
- Validation messages could diverge between API and UI -> Keep UI checks lightweight and rely on API as source of truth, mirroring supported MIME/size copy.
- Large preview images can make onboarding feel slow -> Use local object URLs for preview and avoid uploading until submit.

## Migration Plan

1. Extend the organization onboarding API schema/route to accept optional multipart `letterhead`.
2. Reuse the existing letterhead upload helper during organization creation and return the serialized organization with active letterhead data.
3. Regenerate `@licitadoc/api-client`.
4. Update owner organization onboarding UI/hook/tests to submit optional files and handle API validation errors.
5. Keep existing JSON/no-letterhead onboarding tests passing for backwards compatibility.

Rollback: keep the backend accepting organization fields without a file and hide/remove the web file control. Existing organizations and letterhead assets remain valid under the separate management flow.

## Open Questions

None.
