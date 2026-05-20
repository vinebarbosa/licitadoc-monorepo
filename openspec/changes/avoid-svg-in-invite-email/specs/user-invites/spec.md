## ADDED Requirements

### Requirement: Invite e-mail HTML avoids SVG logo assets
The system MUST render invite e-mail HTML without inline SVG tags, SVG data URIs, or SVG image asset references.

#### Scenario: Organization owner invite contains no SVG
- **WHEN** the system renders an organization-owner invite e-mail
- **THEN** the HTML contains no `<svg>` tags
- **AND** the HTML contains no `image/svg+xml` references
- **AND** the HTML contains no `.svg` image references

#### Scenario: Provisioned member invite contains no SVG
- **WHEN** the system renders a provisioned member invite e-mail with a temporary password
- **THEN** the HTML contains no `<svg>` tags
- **AND** the HTML contains no `image/svg+xml` references
- **AND** the HTML contains no `.svg` image references

### Requirement: Invite e-mail logo uses e-mail-client-compatible branding
The system MUST keep LicitaDoc branding in invite e-mails using a Gmail-compatible brand rendering strategy.

#### Scenario: Invite e-mail uses raster logo or safe fallback
- **WHEN** the system renders any invite e-mail HTML
- **THEN** the brand mark uses a PNG or JPG image served from a stable URL, or an explicitly documented non-image fallback that contains no SVG
- **AND** the brand mark includes accessible alternative text when an image is used
- **AND** the visible brand name remains LicitaDoc

#### Scenario: Image blocking still identifies the product
- **WHEN** an e-mail client blocks remote images in the invite e-mail
- **THEN** the rendered message still visibly identifies the product as LicitaDoc through text outside the image

### Requirement: SVG removal preserves invite delivery semantics
The system MUST preserve existing invite e-mail behavior while changing only the logo rendering strategy.

#### Scenario: Organization owner delivery semantics are preserved
- **WHEN** the system sends an organization-owner invite e-mail
- **THEN** the message keeps the target recipient, subject intent, invite URL CTA, role copy, expiration context, plaintext fallback, Resend tags, and idempotency key

#### Scenario: Provisioned member delivery semantics are preserved
- **WHEN** the system sends a provisioned member invite e-mail with a temporary password
- **THEN** the message keeps the sign-in CTA target when present, temporary password guidance, first-access guidance, role copy, expiration context, plaintext fallback, Resend tags, and idempotency key
