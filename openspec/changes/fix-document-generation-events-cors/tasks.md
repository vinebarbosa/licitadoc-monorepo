## 1. SSE CORS Fix

- [x] 1.1 Add allowed-origin resolution for SSE responses using `app.config.CORS_ORIGIN`.
- [x] 1.2 Add manual CORS headers to `/api/documents/:documentId/events` raw `writeHead` responses.
- [x] 1.3 Preserve authentication and document visibility checks before opening the SSE stream.
- [x] 1.4 Ensure disallowed origins do not receive permissive credentialed CORS headers.

## 2. Tests

- [x] 2.1 Add or adjust API tests for allowed `Origin` SSE CORS headers.
- [x] 2.2 Add or adjust API tests for disallowed `Origin` behavior.
- [x] 2.3 Add or adjust frontend/MSW tests only if the EventSource fallback behavior changes.

## 3. Validation

- [x] 3.1 Run the relevant API tests and typecheck.
- [x] 3.2 Run the relevant web tests/typecheck if frontend files are touched.
