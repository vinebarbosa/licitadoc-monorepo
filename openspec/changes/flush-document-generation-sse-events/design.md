## Context

The document generation pipeline now has three streaming layers:

1. Ollama returns NDJSON chunks.
2. The API provider invokes `onChunk`, and the worker publishes document generation events.
3. The `/api/documents/:documentId/events` route writes those events to a browser `EventSource`.

The frontend can animate deltas after they arrive, but the browser Network/EventStream panel still shows long periods with no event rows and then a burst. The current SSE route uses `reply.hijack()` and `reply.raw.write(...)`, but it does not explicitly flush headers, disable intermediary buffering beyond cache control, set socket no-delay, or expose per-event sequence/timing metadata. That makes it hard to tell whether the delay is provider-side token latency or backend/browser buffering.

## Goals / Non-Goals

**Goals:**

- Minimize API-side buffering between `publishChunk` and browser-visible SSE events.
- Send stream headers immediately when the SSE route opens.
- Add anti-buffering response headers that are safe for local/dev and common reverse proxies.
- Flush each SSE event write where Node's response/socket APIs allow it.
- Preserve auth, document visibility, CORS, snapshots, heartbeats, completion, and failure behavior.
- Add enough event timing/sequence evidence to diagnose where bursts originate.

**Non-Goals:**

- Change the frontend typewriter animation or document preview layout.
- Change Ollama model selection, prompt shape, or provider request semantics.
- Persist every intermediate chunk in the database.
- Introduce WebSockets, Redis pub/sub, or a new realtime dependency.
- Guarantee token-level display before the provider emits a token; if Ollama does not emit for 90 seconds, the API cannot show generated content before that.

## Decisions

1. **Harden the SSE response for streaming delivery.**

   The SSE route should call `reply.hijack()`, set no-delay on the raw socket when available, write headers with existing CORS values plus streaming headers, and flush headers immediately. Headers should include `content-type: text/event-stream; charset=utf-8`, `cache-control: no-cache, no-transform`, `connection: keep-alive`, `x-accel-buffering: no`, and `vary: Origin` when CORS applies.

2. **Flush after each event frame.**

   `writeSseEvent` should write one complete SSE frame and then flush the response if the runtime exposes a flush method. For plain Node HTTP, `raw.write` normally sends chunks, but explicit flushing and no-delay reduce ambiguity and protect against framework/proxy layers. The helper should also handle backpressure by checking the return value of `write` or leaving room for a future drain path without dropping events.

3. **Add sequence and timing metadata to server-side events or logs.**

   The event stream should expose low-risk diagnostic fields such as `sequence`, `serverSentAt`, or `publishedAt` for transient generation events, or log equivalent data at debug level. This makes it possible to compare:

   - provider chunk time,
   - event publish time,
   - SSE write time,
   - browser EventStream time.

   Event consumers should remain compatible with existing fields. Extra fields in JSON are acceptable for the current frontend parser.

4. **Keep chunk content semantics unchanged.**

   The payload must still include `textDelta` and accumulated `content` for chunk events. This change is about delivery timing and observability, not changing how content is accumulated or persisted.

5. **Test the backend boundary.**

   Tests should cover headers and helper behavior in isolation where a real long-lived SSE route is awkward to assert. If feasible, add an integration-style route test using a controlled raw writable stream or injected app route to verify event frames are written separately and flush is called per event.

## Risks / Trade-offs

- **Provider delay can be mistaken for SSE buffering** -> Add timing evidence so the team can distinguish "Ollama has not emitted" from "API wrote but browser received later."
- **Flush APIs differ by runtime** -> Guard optional methods and keep the route working on plain Node HTTP.
- **More frequent flushes can increase overhead** -> SSE document generation is low fan-out and local to a single preview, so the latency win is worth it.
- **Extra event metadata may surprise strict consumers** -> Current frontend JSON parsing ignores unknown fields; keep required event fields unchanged.
- **Tests for raw streaming can be brittle** -> Prefer small helpers for headers/framing/flush behavior and keep route integration tests minimal.
