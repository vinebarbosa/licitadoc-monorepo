## ADDED Requirements

### Requirement: Invite e-mail HTML uses the landing page brand mark
The system MUST render invite e-mail HTML with the same LicitaDoc scale-icon logo treatment used by the public landing page instead of a text-only `LD` mark.

#### Scenario: Organization owner invite shows landing brand mark
- **WHEN** the system renders an organization-owner invite e-mail
- **THEN** the HTML includes a LicitaDoc logo mark based on the landing page scale icon treatment
- **AND** the visible brand name remains LicitaDoc
- **AND** the old `LD` text mark is not used as the logo

#### Scenario: Provisioned member invite shows landing brand mark
- **WHEN** the system renders a provisioned member invite e-mail with a temporary password
- **THEN** the HTML includes a LicitaDoc logo mark based on the landing page scale icon treatment
- **AND** the visible brand name remains LicitaDoc
- **AND** the old `LD` text mark is not used as the logo

### Requirement: Invite e-mail HTML uses the light design-system palette
The system MUST render invite e-mail HTML in light mode using e-mail-safe color values derived from the app's light design-system palette.

#### Scenario: Invite e-mail uses light surfaces and text
- **WHEN** the system renders any invite e-mail HTML
- **THEN** the body, card, dividers, muted text, password guidance, and primary CTA use light-mode palette values derived from the app background, card, border, muted-foreground, primary, and primary-foreground tokens
- **AND** the message does not use a dark page background as its default rendered surface

#### Scenario: Invite e-mail declares light color scheme
- **WHEN** the system renders any invite e-mail HTML
- **THEN** the HTML head declares a light color-scheme preference for e-mail clients that honor it
- **AND** inline styles still provide explicit light-mode colors for clients that ignore color-scheme metadata

### Requirement: Invite e-mail branding refresh preserves invite semantics
The system MUST preserve the existing invite e-mail behavior while changing only the visual branding and palette.

#### Scenario: Organization owner invite preserves delivery content
- **WHEN** the system sends an organization-owner invite e-mail
- **THEN** the message keeps the target recipient, subject intent, invite URL CTA, role copy, expiration context, plaintext fallback, Resend tags, and idempotency key

#### Scenario: Provisioned member invite preserves credential guidance
- **WHEN** the system sends a provisioned member invite e-mail with a temporary password
- **THEN** the message keeps the sign-in CTA target when present, temporary password guidance, first-access guidance, role copy, expiration context, plaintext fallback, Resend tags, and idempotency key
