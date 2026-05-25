## 1. Process Listing Contract

- [x] 1.1 Update `GET /api/processes` ordering so default paginated results are sorted by the derived activity timestamp across process and related document updates
- [x] 1.2 Preserve existing organization scoping, pagination, and document summary serialization while changing the ordering logic
- [x] 1.3 Add or update API tests proving a process with newer document activity appears before a newer created process with older activity

## 2. Home Resume Cards

- [x] 2.1 Replace the local `inProgressDocuments` mock with process-based resume card data derived from `useProcessesList`
- [x] 2.2 Compute resume progress from `documents.completedCount / documents.totalRequiredCount`, with four expected documents mapping to 25% increments
- [x] 2.3 Render up to three activity-ordered process cards with process identity, concise title/object, latest activity, progress, and process-detail continuation links
- [x] 2.4 Add honest loading, empty, and error states for the resume section without rendering mocked document titles
- [x] 2.5 Keep the "Processos de Contratacao" table functional from the same process list response

## 3. Verification

- [x] 3.1 Update home page tests to assert process-based resume cards, 25% progress increments, detail links, and absence of mocked document cards
- [x] 3.2 Update affected process listing tests or fixtures for activity-based ordering
- [x] 3.3 Run targeted API and web tests for the process listing and home page behavior
