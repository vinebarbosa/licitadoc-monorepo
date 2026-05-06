## 1. Home page implementation

- [x] 1.1 Port the validated Central de Trabalho layout from `tmp/dashboard.tsx` into `AppHomePage` using current `react-router-dom` and `@/shared/ui` imports
- [x] 1.2 Preserve quick actions for DFD, ETP, TR, and Minuta with the validated labels, descriptions, icons, and creation links
- [x] 1.3 Preserve "Continuar de onde parei" with local mocked document cards, progress bars, and continuation links
- [x] 1.4 Connect the "Processos de Contratacao" table to `useProcessesList` with a short first page of API-backed processes
- [x] 1.5 Render process status, type, document progress, latest update, and detail links using current process module helpers
- [x] 1.6 Add loading, empty, and error states for the processes section without rendering mock process rows

## 2. Web validation

- [x] 2.1 Add focused tests for the authenticated home page header, quick actions, mocked resume cards, and API-backed process rows
- [x] 2.2 Add focused tests for process loading, empty, and error states on the home page
- [x] 2.3 Update MSW fixtures or handlers only if existing process fixtures do not cover the home page behavior
- [x] 2.4 Run focused web tests and type/lint validation for the touched slice

## 3. API review

- [x] 3.1 Confirm the existing process listing API satisfies the home page data needs
- [x] 3.2 Avoid API or generated-client changes unless implementation reveals a real missing contract
