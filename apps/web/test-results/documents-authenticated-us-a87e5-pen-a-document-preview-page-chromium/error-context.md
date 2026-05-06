# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: documents.spec.ts >> authenticated user can open a document preview page
- Location: e2e/documents.spec.ts:95:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Preview do Documento')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Preview do Documento')

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
                - link "DFD - PE-2024-045" [disabled] [ref=e125]
          - button "Notificações" [ref=e126]:
            - img
            - generic [ref=e127]: "2"
        - main [ref=e128]:
          - generic [ref=e129]:
            - generic [ref=e130]:
              - generic [ref=e131]:
                - link "Voltar para Documentos" [ref=e132] [cursor=pointer]:
                  - /url: /app/documentos
                  - img
                - generic [ref=e133]:
                  - generic [ref=e134]:
                    - heading "DFD - PE-2024-045" [level=1] [ref=e135]
                    - generic [ref=e136]:
                      - img
                      - text: Concluído
                  - generic [ref=e137]:
                    - generic [ref=e138]:
                      - img [ref=e139]
                      - text: Formalização de Demanda
                    - link "PE-2024-045" [ref=e142] [cursor=pointer]:
                      - /url: /app/processo/process-1
                      - text: PE-2024-045
                      - img [ref=e143]
              - link "Documentos" [ref=e147] [cursor=pointer]:
                - /url: /app/documentos
                - img
                - text: Documentos
            - generic [ref=e149]:
              - generic [ref=e150]:
                - paragraph [ref=e151]: Tipo
                - paragraph [ref=e152]: Formalização de Demanda
              - generic [ref=e153]:
                - paragraph [ref=e154]: Processo
                - link "PE-2024-045" [ref=e155] [cursor=pointer]:
                  - /url: /app/processo/process-1
              - generic [ref=e156]:
                - paragraph [ref=e157]: Responsáveis
                - paragraph [ref=e158]: Maria Costa
              - generic [ref=e159]:
                - paragraph [ref=e160]: Última Atualização
                - paragraph [ref=e161]: 20 de mar. de 2024
            - article [ref=e164]:
              - generic [ref=e165]:
                - heading "DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)" [level=1] [ref=e166]
                - paragraph [ref=e167]:
                  - strong [ref=e168]: "Processo:"
                  - text: PE-2024-045
                - heading "1. Objeto" [level=2] [ref=e169]
                - paragraph [ref=e170]: Contratacao de Servicos de TI para suporte tecnico especializado.
                - list [ref=e171]:
                  - listitem [ref=e172]: Suporte a infraestrutura de rede
                  - listitem [ref=e173]: Manutencao de servidores
                - table [ref=e175]:
                  - rowgroup [ref=e176]:
                    - row "Item Valor" [ref=e177]:
                      - columnheader "Item" [ref=e178]
                      - columnheader "Valor" [ref=e179]
                  - rowgroup [ref=e180]:
                    - row "Suporte mensal R$ 5.000,00" [ref=e181]:
                      - cell "Suporte mensal" [ref=e182]
                      - cell "R$ 5.000,00" [ref=e183]
  - region "Notifications alt+T"
```

# Test source

```ts
  43  |           updatedAt: "2024-03-20T00:00:00.000Z",
  44  |           draftContent: "DOCUMENTO DE FORMALIZACAO DE DEMANDA\n\nContratacao de Servicos de TI.",
  45  |           storageKey: null,
  46  |         },
  47  |       });
  48  |       return;
  49  |     }
  50  | 
  51  |     await route.fulfill({
  52  |       json: {
  53  |         items: [
  54  |           {
  55  |             id: "document-1",
  56  |             name: "DFD - PE-2024-045",
  57  |             organizationId: "organization-1",
  58  |             processId: "process-1",
  59  |             processNumber: "PE-2024-045",
  60  |             type: "dfd",
  61  |             status: "completed",
  62  |             responsibles: ["Maria Costa"],
  63  |             createdAt: "2024-03-20T00:00:00.000Z",
  64  |             updatedAt: "2024-03-20T00:00:00.000Z",
  65  |           },
  66  |           {
  67  |             id: "document-2",
  68  |             name: "ETP - PE-2024-045",
  69  |             organizationId: "organization-1",
  70  |             processId: "process-1",
  71  |             processNumber: "PE-2024-045",
  72  |             type: "etp",
  73  |             status: "generating",
  74  |             responsibles: ["Maria Costa"],
  75  |             createdAt: "2024-03-21T00:00:00.000Z",
  76  |             updatedAt: "2024-03-21T00:00:00.000Z",
  77  |           },
  78  |         ],
  79  |       },
  80  |     });
  81  |   });
  82  | 
  83  |   await page.goto("/app/documentos");
  84  | 
  85  |   await expect(page.getByRole("heading", { name: "Documentos" })).toBeVisible();
  86  |   await expect(page.getByRole("link", { name: /Novo Documento/ })).toBeVisible();
  87  | 
  88  |   await expect(page.getByRole("link", { name: "DFD - PE-2024-045" })).toBeVisible();
  89  |   await expect(page.getByRole("link", { name: "ETP - PE-2024-045" })).toBeVisible();
  90  | 
  91  |   await expect(page.getByText("Total")).toBeVisible();
  92  |   await expect(page.getByText("Concluídos")).toBeVisible();
  93  | });
  94  | 
  95  | test("authenticated user can open a document preview page", async ({ page }) => {
  96  |   await page.route("**/api/auth/get-session", async (route) => {
  97  |     await route.fulfill({
  98  |       json: {
  99  |         session: {
  100 |           id: "session-1",
  101 |           token: "session-token",
  102 |           userId: "user-1",
  103 |           expiresAt: "2026-05-25T00:00:00.000Z",
  104 |           createdAt: "2026-04-25T00:00:00.000Z",
  105 |           updatedAt: "2026-04-25T00:00:00.000Z",
  106 |         },
  107 |         user: {
  108 |           id: "user-1",
  109 |           name: "Maria Silva",
  110 |           email: "maria@licitadoc.test",
  111 |           role: "member",
  112 |           organizationId: "organization-1",
  113 |           createdAt: "2026-04-25T00:00:00.000Z",
  114 |           updatedAt: "2026-04-25T00:00:00.000Z",
  115 |         },
  116 |       },
  117 |     });
  118 |   });
  119 | 
  120 |   await page.route("**/api/documents/document-1", async (route) => {
  121 |     await route.fulfill({
  122 |       json: {
  123 |         id: "document-1",
  124 |         name: "DFD - PE-2024-045",
  125 |         organizationId: "organization-1",
  126 |         processId: "process-1",
  127 |         processNumber: "PE-2024-045",
  128 |         type: "dfd",
  129 |         status: "completed",
  130 |         responsibles: ["Maria Costa"],
  131 |         createdAt: "2024-03-20T00:00:00.000Z",
  132 |         updatedAt: "2024-03-20T00:00:00.000Z",
  133 |         draftContent:
  134 |           "# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)\n\n**Processo:** PE-2024-045\n\n## 1. Objeto\n\nContratacao de Servicos de TI para suporte tecnico especializado.\n\n- Suporte a infraestrutura de rede\n- Manutencao de servidores\n\n| Item | Valor |\n|------|-------|\n| Suporte mensal | R$ 5.000,00 |\n",
  135 |         storageKey: null,
  136 |       },
  137 |     });
  138 |   });
  139 | 
  140 |   await page.goto("/app/documento/document-1/preview");
  141 | 
  142 |   await expect(page.getByRole("heading", { name: "DFD - PE-2024-045" })).toBeVisible();
> 143 |   await expect(page.getByText("Preview do Documento")).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  144 | 
  145 |   // Markdown content renders as semantic elements
  146 |   await expect(
  147 |     page.getByRole("heading", { level: 1, name: /DOCUMENTO DE FORMALIZACAO DE DEMANDA/ }),
  148 |   ).toBeVisible();
  149 |   await expect(page.getByRole("heading", { level: 2, name: /1\. Objeto/ })).toBeVisible();
  150 |   await expect(page.getByText(/Contratacao de Servicos de TI/)).toBeVisible();
  151 |   await expect(page.getByRole("table")).toBeVisible();
  152 |   await expect(page.locator("article").getByRole("list")).toBeVisible();
  153 | });
  154 | 
```