## Why

O prompt atual de ETP preserva segurança documental, mas incentiva documentos longos, repetitivos e abstratos mesmo para objetos simples. A refatoração é necessária para manter o rigor jurídico-administrativo enquanto melhora proporcionalidade, concretude operacional e naturalidade dos ETPs gerados pela API.

## What Changes

- Reescrever completamente `apps/api/src/modules/documents/recipes/etp.instructions.md` com hierarquia mais modular e menos redundante.
- Preservar os pilares atuais: não inventar dados, conservadorismo documental, Lei nº 14.133/2021, fase preparatória, estimativa ausente/zero, metodologia de preços, riscos, gestão/fiscalização, estrutura canônica e coerência narrativa.
- Adicionar regras explícitas de proporcionalidade por complexidade, risco, valor, criticidade e impacto operacional.
- Reduzir prolixidade, repetição semântica e linguagem inflada de IA institucional.
- Incentivar análise operacional concreta: logística, recebimento, armazenamento, conferência, kits, execução prática, controles e riscos materiais compatíveis com o objeto.
- Melhorar a orientação de alternativas para considerar execução direta, SRP, adesão, lote único, parcelamento, kits prontos versus montagem interna, fornecimento centralizado, redução de escopo e simplificação logística quando o contexto permitir.
- Atualizar testes para proteger os novos critérios editoriais e garantir que as regras anti-alucinação e de estimativa permanecem presentes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: passa a exigir que a receita de ETP seja proporcional à complexidade do objeto, menos repetitiva, mais concreta operacionalmente e ainda segura contra invenção documental.

## Impact

- Afeta `apps/api/src/modules/documents/recipes/etp.instructions.md`.
- Afeta testes de receita e prompt em `apps/api/src/modules/documents/document-generation-recipes.test.ts`.
- Não exige migração de banco, alteração de API pública, nova dependência ou mudança no template Markdown de ETP.
