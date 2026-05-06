## Context

Document generation now runs asynchronously, but the background worker still depends on the selected text generation provider finishing within that provider adapter's timeout. The current OpenAI adapter aborts after 90 seconds, while the Ollama adapter aborts after 10 minutes. Those values are hard-coded in adapter implementations, so operators cannot tune the timeout for larger prompts, slower models, or local hardware without changing code.

The runtime configuration already owns provider selection, model, API key, and base URL through `apps/api/src/plugins/env.ts` and `registerTextGenerationPlugin`. Timeout configuration belongs in the same path so provider construction remains centralized and document services stay provider-agnostic.

## Goals / Non-Goals

**Goals:**
- Add a runtime environment variable for text generation request timeout in milliseconds.
- Use the configured timeout for OpenAI and Ollama provider calls.
- Preserve current provider defaults when the environment variable is absent.
- Keep timeout failures normalized as `TextGenerationError` with code `timeout`.
- Document the new environment variable in `.env.example`.

**Non-Goals:**
- Changing document generation from background execution back to synchronous execution.
- Adding retry, cancellation, or resume behavior for failed generation runs.
- Adding per-provider timeout variables in the first version.
- Changing OpenAI or Ollama request payloads beyond timeout handling.
- Changing public document API contracts or database schema.

## Decisions

### Add a single provider-neutral timeout setting

Introduce `TEXT_GENERATION_TIMEOUT_MS` as an optional positive integer environment value. When set, `registerTextGenerationPlugin` passes that value into `resolveTextGenerationProvider`, and supported adapters use it for their `AbortController` timeout.

Rationale:
- The existing configuration names are provider-neutral (`TEXT_GENERATION_PROVIDER`, `TEXT_GENERATION_MODEL`, `TEXT_GENERATION_API_KEY`, `TEXT_GENERATION_BASE_URL`).
- Operators usually need one knob for "how long can generation run" regardless of the active provider.
- A millisecond value matches the current code and avoids unit ambiguity inside provider constructors.

Alternatives considered:
- `TEXT_GENERATION_TIMEOUT_SECONDS`: easier for humans, but requires conversion and can be less precise in tests.
- Separate `OPENAI_TEXT_GENERATION_TIMEOUT_MS` and `OLLAMA_TEXT_GENERATION_TIMEOUT_MS`: more flexible, but adds configuration surface before there is a clear need.
- Hard-code a larger OpenAI timeout: solves one local symptom but keeps deployments unable to tune the value.

### Preserve provider-specific defaults when unset

Keep OpenAI defaulting to 90 seconds and Ollama defaulting to 10 minutes unless `TEXT_GENERATION_TIMEOUT_MS` is configured.

Rationale:
- Existing deployments keep their current behavior unless they opt in.
- Ollama's longer default remains useful for local models and slower machines.
- OpenAI's current timeout behavior remains predictable for hosted generation unless operators choose a longer window.

Alternatives considered:
- Use one new default for all providers: rejected because it would silently change Ollama or OpenAI behavior without explicit configuration.

### Store timeout only in runtime configuration, not generation metadata

Do not add timeout duration to `document_generation_runs.responseMetadata` or request metadata in this change.

Rationale:
- The immediate problem is configurability, not audit reporting.
- Failed runs already persist normalized `timeout` error information.
- Metadata schema changes can be added later if operators need timeout observability.

Alternatives considered:
- Persist timeout duration in every generation run: useful for diagnostics, but unnecessary for fixing timeout tuning and would broaden the change.

## Risks / Trade-offs

- [Very high timeout can leave background jobs running longer] -> Keep the value explicit and positive in env configuration; operators choose the deployment-appropriate limit.
- [A single timeout may be imperfect across providers] -> Start provider-neutral and add per-provider overrides later if real deployments need them.
- [Invalid env values could fail startup] -> Parse as a positive integer so misconfiguration is caught early instead of silently falling back.
- [Long provider calls can still fail upstream] -> Preserve normalized provider error handling so failures are stored consistently.

## Migration Plan

No database migration is required. Existing environments keep current defaults. To increase the OpenAI timeout, set `TEXT_GENERATION_TIMEOUT_MS` in the API environment, for example `300000` for five minutes, then restart the API process.

Rollback is straightforward: remove the environment variable to return to provider defaults, or revert the provider constructor changes.

## Open Questions

None.
