# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: document-create.spec.ts >> authenticated user can reach /app/documento/novo and complete the create flow
- Location: e2e/document-create.spec.ts:70:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Criar e Editar/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - list [ref=e9]:
            - listitem [ref=e10]:
              - link "LicitaDoc Lei 14.133" [ref=e11] [cursor=pointer]:
                - /url: /app
                - img [ref=e13]
                - generic [ref=e17]:
                  - generic [ref=e18]: LicitaDoc
                  - generic [ref=e19]: Lei 14.133
          - list [ref=e20]:
            - listitem [ref=e21]:
              - link "Novo Processo" [ref=e22] [cursor=pointer]:
                - /url: /app/processo/novo
                - img [ref=e23]
                - generic [ref=e24]: Novo Processo
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]: Menu
            - list [ref=e29]:
              - listitem [ref=e30]:
                - link "Central de Trabalho" [ref=e31] [cursor=pointer]:
                  - /url: /app
                  - img [ref=e32]
                  - generic [ref=e37]: Central de Trabalho
              - listitem [ref=e38]:
                - link "Processos 5" [ref=e39] [cursor=pointer]:
                  - /url: /app/processos
                  - img [ref=e40]
                  - generic [ref=e42]: Processos
                  - generic [ref=e43]: "5"
              - listitem [ref=e44]:
                - link "Documentos" [ref=e45] [cursor=pointer]:
                  - /url: /app/documentos
                  - img [ref=e46]
                  - generic [ref=e49]: Documentos
          - generic [ref=e50]:
            - generic [ref=e51]: Tipos de Documento
            - list [ref=e53]:
              - listitem [ref=e54]:
                - link "DFD" [ref=e55] [cursor=pointer]:
                  - /url: /app/documentos?tipo=dfd
                  - img [ref=e56]
                  - generic [ref=e59]: DFD
              - listitem [ref=e60]:
                - link "ETP" [ref=e61] [cursor=pointer]:
                  - /url: /app/documentos?tipo=etp
                  - img [ref=e62]
                  - generic [ref=e67]: ETP
              - listitem [ref=e68]:
                - link "TR" [ref=e69] [cursor=pointer]:
                  - /url: /app/documentos?tipo=tr
                  - img [ref=e70]
                  - generic [ref=e73]: TR
              - listitem [ref=e74]:
                - link "Minuta" [ref=e75] [cursor=pointer]:
                  - /url: /app/documentos?tipo=minuta
                  - img [ref=e76]
                  - generic [ref=e80]: Minuta
          - generic [ref=e81]:
            - generic [ref=e82]: Sistema
            - list [ref=e84]:
              - listitem [ref=e85]:
                - link "Configurações" [ref=e86] [cursor=pointer]:
                  - /url: /app/configuracoes
                  - img [ref=e87]
                  - generic [ref=e90]: Configurações
              - listitem [ref=e91]:
                - link "Ajuda" [ref=e92] [cursor=pointer]:
                  - /url: /app/ajuda
                  - img [ref=e93]
                  - generic [ref=e96]: Ajuda
        - list [ref=e98]:
          - listitem [ref=e99]:
            - button "MS Maria Silva Analista de Licitações" [ref=e100]:
              - generic [ref=e102]: MS
              - generic [ref=e103]:
                - generic [ref=e104]: Maria Silva
                - generic [ref=e105]: Analista de Licitações
              - img [ref=e106]
      - main [ref=e108]:
        - generic [ref=e109]:
          - button "Toggle Sidebar" [ref=e110]:
            - img
            - generic [ref=e111]: Toggle Sidebar
          - navigation "breadcrumb" [ref=e112]:
            - list [ref=e113]:
              - listitem [ref=e114]:
                - link "Central de Trabalho" [ref=e115] [cursor=pointer]:
                  - /url: /app
              - listitem [ref=e116]:
                - img [ref=e117]
              - listitem [ref=e119]:
                - link "Documentos" [ref=e120] [cursor=pointer]:
                  - /url: /app/documentos
              - listitem [ref=e121]:
                - img [ref=e122]
              - listitem [ref=e124]:
                - link "Novo Documento" [disabled] [ref=e125]
          - generic [ref=e126]:
            - img [ref=e127]
            - textbox "Buscar processos, documentos..." [ref=e130]
          - button "Notificações" [ref=e131]:
            - img
            - generic [ref=e132]: "2"
        - main [ref=e133]:
          - generic [ref=e134]:
            - generic [ref=e135]:
              - link "Voltar para Documentos" [ref=e136] [cursor=pointer]:
                - /url: /app/documentos
                - img [ref=e137]
              - generic [ref=e139]:
                - heading "Novo Documento" [level=1] [ref=e140]
                - paragraph [ref=e141]: Selecione o tipo de documento que deseja criar
            - generic [ref=e142]:
              - generic [ref=e143]:
                - generic [ref=e144]:
                  - generic [ref=e145]: Tipo de Documento
                  - generic [ref=e146]: Escolha o tipo de documento conforme a Lei 14.133/2021
                - generic [ref=e148]:
                  - button "Selecionar DFD" [ref=e149]:
                    - img [ref=e151]
                    - generic [ref=e154]:
                      - generic [ref=e155]:
                        - generic [ref=e156]: DFD
                        - generic [ref=e157]: Selecionado
                      - paragraph [ref=e158]: Documento de Formalização de Demanda
                      - paragraph [ref=e159]: Justifica a necessidade da contratação, com base no planejamento estratégico da instituição.
                  - button "Selecionar ETP" [ref=e160]:
                    - img [ref=e162]
                    - generic [ref=e167]:
                      - generic [ref=e169]: ETP
                      - paragraph [ref=e170]: Estudo Técnico Preliminar
                      - paragraph [ref=e171]: Analisa as soluções disponíveis no mercado e define a melhor estratégia de contratação.
                  - button "Selecionar TR" [ref=e172]:
                    - img [ref=e174]
                    - generic [ref=e177]:
                      - generic [ref=e179]: TR
                      - paragraph [ref=e180]: Termo de Referência
                      - paragraph [ref=e181]: Especifica as condições técnicas, requisitos e critérios para a contratação.
                  - button "Selecionar Minuta" [ref=e182]:
                    - img [ref=e184]
                    - generic [ref=e188]:
                      - generic [ref=e190]: Minuta
                      - paragraph [ref=e191]: Minuta do Contrato
                      - paragraph [ref=e192]: Define as cláusulas contratuais, obrigações das partes e penalidades.
              - generic [ref=e193]:
                - generic [ref=e194]:
                  - generic [ref=e195]: Processo de Contratação
                  - generic [ref=e196]: Vincule este documento a um processo existente
                - generic [ref=e197]:
                  - generic [ref=e198]:
                    - generic [ref=e199]: Processo *
                    - combobox "Processo *" [active] [ref=e200]:
                      - generic:
                        - generic: PE-2024-045
                        - generic: Contratação de Serviços de TI
                      - img
                    - combobox [ref=e201]
                  - generic [ref=e202]:
                    - generic [ref=e203]: Nome do Documento
                    - textbox "Nome do Documento" [ref=e204]:
                      - /placeholder: Nome será gerado automaticamente
                      - text: DFD - PE-2024-045
                    - paragraph [ref=e205]: O nome é gerado automaticamente, mas pode ser personalizado.
              - generic [ref=e206]:
                - link "Cancelar" [ref=e207] [cursor=pointer]:
                  - /url: /app/documentos
                - button "Criar documento" [ref=e208]:
                  - text: Criar documento
                  - img
  - region "Notifications alt+T"
```

# Test source

```ts
  24  |   items: [
  25  |     {
  26  |       id: "process-1",
  27  |       organizationId: "organization-1",
  28  |       type: "pregao-eletronico",
  29  |       processNumber: "PE-2024-045",
  30  |       externalId: null,
  31  |       issuedAt: "2024-03-01T00:00:00.000Z",
  32  |       object: "Contratação de Serviços de TI",
  33  |       justification: "Necessidade de suporte técnico especializado.",
  34  |       responsibleName: "Maria Costa",
  35  |       status: "em_edicao",
  36  |       sourceKind: null,
  37  |       sourceReference: null,
  38  |       sourceMetadata: null,
  39  |       departmentIds: ["department-1"],
  40  |       createdAt: "2024-03-01T00:00:00.000Z",
  41  |       updatedAt: "2024-03-28T00:00:00.000Z",
  42  |       documents: {
  43  |         completedCount: 1,
  44  |         totalRequiredCount: 4,
  45  |         completedTypes: ["dfd"],
  46  |         missingTypes: ["etp", "tr", "minuta"],
  47  |       },
  48  |       listUpdatedAt: "2024-03-28T00:00:00.000Z",
  49  |     },
  50  |   ],
  51  |   page: 1,
  52  |   pageSize: 100,
  53  |   total: 1,
  54  |   totalPages: 1,
  55  | };
  56  | 
  57  | const DOCUMENT_CREATED_FIXTURE = {
  58  |   id: "document-created",
  59  |   name: "DFD - PE-2024-045",
  60  |   organizationId: "organization-1",
  61  |   processId: "process-1",
  62  |   processNumber: "PE-2024-045",
  63  |   type: "dfd",
  64  |   status: "generating",
  65  |   responsibles: ["Maria Silva"],
  66  |   createdAt: "2026-04-26T00:00:00.000Z",
  67  |   updatedAt: "2026-04-26T00:00:00.000Z",
  68  | };
  69  | 
  70  | test("authenticated user can reach /app/documento/novo and complete the create flow", async ({
  71  |   page,
  72  | }) => {
  73  |   const browserErrors: string[] = [];
  74  |   page.on("console", (message) => {
  75  |     if (message.type() === "error") {
  76  |       browserErrors.push(message.text());
  77  |     }
  78  |   });
  79  |   page.on("pageerror", (error) => {
  80  |     browserErrors.push(error.message);
  81  |   });
  82  | 
  83  |   await page.route("**/api/auth/get-session", async (route) => {
  84  |     await route.fulfill({ json: SESSION_FIXTURE });
  85  |   });
  86  | 
  87  |   await page.route("**/api/processes/**", async (route) => {
  88  |     await route.fulfill({ json: PROCESSES_FIXTURE });
  89  |   });
  90  | 
  91  |   await page.route("**/api/documents/**", async (route) => {
  92  |     if (route.request().method() === "POST") {
  93  |       await route.fulfill({ status: 201, json: DOCUMENT_CREATED_FIXTURE });
  94  |     } else {
  95  |       await route.fulfill({ json: { items: [] } });
  96  |     }
  97  |   });
  98  | 
  99  |   await page.goto("/app/documento/novo");
  100 | 
  101 |   // Page renders inside the protected shell
  102 |   await expect(page.getByRole("heading", { name: "Novo Documento" })).toBeVisible();
  103 |   await expect(page.getByText("Selecione o tipo de documento que deseja criar")).toBeVisible();
  104 | 
  105 |   // All four type cards are visible
  106 |   await expect(page.getByRole("button", { name: "Selecionar DFD" })).toBeVisible();
  107 |   await expect(page.getByRole("button", { name: "Selecionar ETP" })).toBeVisible();
  108 |   await expect(page.getByRole("button", { name: "Selecionar TR" })).toBeVisible();
  109 |   await expect(page.getByRole("button", { name: "Selecionar Minuta" })).toBeVisible();
  110 | 
  111 |   // Select the DFD type
  112 |   await page.getByRole("button", { name: "Selecionar DFD" }).click();
  113 |   await expect(page.getByText("Selecionado")).toBeVisible();
  114 | 
  115 |   // Select a process
  116 |   await page.getByRole("combobox").click();
  117 |   await page.getByRole("option", { name: /PE-2024-045/ }).click();
  118 | 
  119 |   // Name should be auto-generated
  120 |   const nameInput = page.getByLabel("Nome do Documento");
  121 |   await expect(nameInput).toHaveValue("DFD - PE-2024-045");
  122 | 
  123 |   // Submit
> 124 |   await page.getByRole("button", { name: /Criar e Editar/i }).click();
      |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  125 | 
  126 |   // Should navigate to documents list after success
  127 |   await expect(page).toHaveURL(/\/app\/documentos$/);
  128 | 
  129 |   expect(browserErrors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
  130 | });
  131 | 
```