## Why

A criação de processo ainda depende de um formulário monolítico e, quando vem de PDFs externos, pode carregar descrições longas ou itens ambíguos que não seguem o padrão do sistema. Transformar a criação do processo em uma Solicitação de Despesa nativa, em etapas, dá controle ao usuário e cria uma estrutura previsível para itens simples, kits e componentes.

## What Changes

- Replace the current one-page process creation flow with a multi-step creation wizard that behaves like a native Solicitação de Despesa.
- Split the flow into clear steps for process/request data, organization and department links, item composition, and final review before creation.
- Add first-class item modeling for:
  - simple items with title/description, quantity, unit, unit value, and total value;
  - kit items with parent kit data and nested components;
  - component title and description so kits do not depend on huge mixed descriptions.
- Persist native SD item metadata in `sourceMetadata.extractedFields.items` using a stable shape that can be reused by process detail and document generation contexts.
- Calculate and display item/kit totals where the user provides quantity and unit values, while allowing manual total override when needed.
- Validate each step before allowing the user to advance, with review-time summary of missing or inconsistent data.
- Keep PDF import as an optional assistive path only if it can populate the same native structure; the native manual form remains the canonical path.

## Capabilities

### New Capabilities

- `web-native-expense-request-process-form`: multi-step frontend workflow for creating a process as a native Solicitação de Despesa, including items, kits, components, validation, and review.

### Modified Capabilities

- `process-management`: preserve native expense request item and kit/component metadata when a process is created from the frontend wizard.

## Impact

- `apps/web/src/modules/processes/pages/process-create-page.tsx` and related `processes` module `model`, `ui`, `api`, and tests.
- Process create request construction and source metadata normalization.
- API schema examples/tests may be refined to document the native SD metadata shape, but no database migration is expected because `sourceMetadata` already stores structured JSON.
- Existing PDF parsing code can remain, but any import result used by the wizard must map into the same item/component structure.
