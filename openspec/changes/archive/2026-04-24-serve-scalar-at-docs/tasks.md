## 1. Documentation UI Setup

- [x] 1.1 Add the Scalar integration dependency needed by `apps/api` and remove the Swagger UI dependency if it is no longer used
- [x] 1.2 Update the API documentation plugin wiring so the backend serves Scalar at `/docs`

## 2. OpenAPI Integration

- [x] 2.1 Keep `/openapi.json` as the canonical merged contract source and configure the Scalar UI to read from that endpoint
- [x] 2.2 Preserve the current merged app/auth documentation coverage after swapping the `/docs` UI

## 3. Verification

- [x] 3.1 Verify the backend still starts and serves the Scalar interface at `/docs`
- [x] 3.2 Verify `/openapi.json` remains available and that the docs route renders from that exported contract
