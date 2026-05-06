## Context

The organization-owner members page consumes the generic users listing with `role=member` and the invites listing with the owner's scope. After the invite flow began provisioning member users directly, the page needs to treat pending onboarding members as real organization members and must refresh the users query after invite creation. Otherwise the page can remain in the empty state even though the backend has created a `member` user for the invited e-mail.

The generated API client currently returns response bodies even for non-2xx HTTP statuses, so page-level mutation code must validate the shape it receives before showing a success toast.

## Goals / Non-Goals

**Goals:**
- Show organization-owner members when the backend returns same-organization users with `role = member`.
- Include invited/provisioned members in `pending_profile` in the members table.
- Refresh the users list after creating a member invite, in addition to refreshing pending invites.
- Avoid misleading success messages when invite creation returns an error body.
- Add focused tests that reproduce an empty/stale members page after invite creation.

**Non-Goals:**
- Redesigning the members page layout.
- Adding member search, pagination UI, resend, revoke, or invite cancellation.
- Changing global API-client error behavior unless a local guard is insufficient.
- Changing organization-owner authorization policy beyond the same-organization member list.

## Decisions

### Keep the backend list contract authoritative
The members page should rely on `/api/users` scoped by the authenticated owner and filtered by `role=member`; the backend should include complete and pending onboarding members in that response.

Rationale: the users table is the source of truth after invite provisioning. Pending onboarding is a user lifecycle status, not a reason to hide the row from the owner.

Alternative considered: derive pending members only from invite records. Rejected because provisioned users already exist and should be managed through user visibility rules.

### Refresh both users and invites after invite creation
The owner invite mutation should invalidate both the invite query and the users query. The exact query keys should cover the parameterized list calls used by the page.

Rationale: member invite creation has two visible side effects: a pending invite and a provisioned user. Refreshing only one can leave the page inconsistent.

Alternative considered: manually append the new member to the cache. Rejected because the API response is invite-shaped, not user-shaped, and refetching keeps ordering/counts consistent.

### Validate invite mutation responses before success UI
The members page should only show the success toast and close/reset the dialog when the mutation result has the expected invite success shape.

Rationale: generated client behavior may surface error bodies as resolved data, and showing `undefined` in success text hides the actual problem.

Alternative considered: modify the shared generated client to throw on non-2xx responses. Deferred because that is broader than this listing fix and could affect multiple existing call sites.

## Risks / Trade-offs

- [Parameterized query invalidation misses the active list] -> Use prefix query keys or exact keys matching the active hooks; add a test that starts empty, creates an invite, and expects the provisioned member row.
- [Pending invite and pending user duplicate the same e-mail] -> Keep the members table as user truth and pending-invites section as invite lifecycle context; future UI can add clearer status labels if needed.
- [Error body looks like success data] -> Validate response shape before success handling and show an error toast otherwise.
- [Backend scope already works but frontend cache is stale] -> Tests should cover both backend member inclusion and frontend post-invite refresh.
