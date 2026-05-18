## Why

The Codex `sd-document-intelligence` skill is producing better DFD, ETP, TR, and Minuta drafts than the current system flow because it enforces a stricter sequence: factual extraction, semantic classification, cautious enrichment, document planning, writing, review, and final rewrite. The system should stop approximating that behavior and instead make the skill's workflow and rules the canonical generation contract.

## What Changes

- Make `sd-document-intelligence` the strict behavioral contract for SD-backed document generation.
- Add a repository-managed, runtime-loadable skill contract derived from the Codex skill, including its workflow, anti-alucination rules, classification requirements, context package shape, document planning rules, and document-specific boundaries.
- Refactor document generation so SD-backed DFD, ETP, TR, and Minuta generation must pass through the skill-aligned stages before writing final Markdown.
- Ensure the Writer cannot bypass classification, context enrichment, document planning, reviewer checks, or final rewrite rules.
- Add drift checks so changes to the Codex skill and the runtime skill contract cannot silently diverge.
- Preserve the current public generation API unless a debug or internal metadata field is explicitly needed.
- Keep the existing humanization work, templates, and document recipes, but make them subordinate to the skill contract.

## Capabilities

### New Capabilities
- `sd-document-intelligence-contract`: Defines the runtime skill contract, stage ordering, context package, drift controls, and strict SD intelligence behavior required before document writing.

### Modified Capabilities
- `document-generation`: SD-backed generation must execute the skill-aligned pipeline and persist/debug the resulting stages without changing the public request shape.
- `document-generation-recipes`: Document recipes must be treated as writer assets only and must not duplicate or weaken the skill's classification, enrichment, planning, anti-alucination, or reviewer rules.

## Impact

- Affected backend modules: document-generation pipeline, recipe loading, prompt assembly, reviewer/rewriter, debug metadata, tests.
- Affected skill assets: `.codex/skills/sd-document-intelligence/SKILL.md` and any repository-managed runtime mirror or generated contract file.
- Affected specs: new `sd-document-intelligence-contract`, modified `document-generation`, modified `document-generation-recipes`.
- API compatibility: public generation request/response compatibility should be preserved; debug metadata may include skill contract version, contract hash, and stage outputs.
