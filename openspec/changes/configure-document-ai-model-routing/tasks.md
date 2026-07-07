## 1. Runtime Configuration

- [ ] 1.1 Add a runtime config setting for the document editor/text-adjustment model with default `gpt-4.1-mini`.
- [ ] 1.2 Ensure the primary full-document generation model is configured as `gpt-5.4` in the OpenAI-oriented env example/defaults.
- [ ] 1.3 Document both model settings in `apps/api/.env.example`.
- [ ] 1.4 Add env parsing tests for the adjustment model default and override behavior.

## 2. Provider Wiring

- [ ] 2.1 Resolve a primary text-generation provider for full document generation using `gpt-5.4`.
- [ ] 2.2 Resolve a document adjustment provider using the same provider credentials/config but model `gpt-4.1-mini`.
- [ ] 2.3 Expose the adjustment provider to the document text-adjustment route/service without changing public API schemas.
- [ ] 2.4 Preserve normalized usage, model, provider key, cost, and error behavior for both provider purposes.

## 3. Document Flow Integration

- [ ] 3.1 Verify full document generation continues to use the primary provider and records model `gpt-5.4` in generation metadata.
- [ ] 3.2 Verify editor text-adjustment suggestions use the adjustment provider and report model `gpt-4.1-mini`.
- [ ] 3.3 Keep apply-adjustment persistence unchanged after a suggestion is accepted.

## 4. Verification

- [ ] 4.1 Add or update unit tests for provider resolution with separate generation and adjustment models.
- [ ] 4.2 Add or update document generation tests asserting full generation uses `gpt-5.4`.
- [ ] 4.3 Add or update document text-adjustment tests asserting editor suggestions use `gpt-4.1-mini`.
- [ ] 4.4 Run relevant API document, text-generation, and env tests.
- [ ] 4.5 Run API typecheck and targeted static checks for touched files.
- [ ] 4.6 Run `openspec validate configure-document-ai-model-routing --strict`.
