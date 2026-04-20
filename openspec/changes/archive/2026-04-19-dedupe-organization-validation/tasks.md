## 1. Canonical Organization Parsing

- [x] 1.1 Extrair helpers de canonicalização de campos de organização e compor schemas Zod reutilizáveis para create e update
- [x] 1.2 Fazer os schemas de `organizations` retornarem payloads já parseados para o formato persistido, canonicalizando `slug`, `state`, `institutionalEmail`, `website` e `logoUrl`, mas preservando a formatação digitada em `phone`, `cnpj` e `zipCode`

## 2. Service Simplification

- [x] 2.1 Atualizar `createOrganization` para consumir o payload já parseado sem repetir validações de formato e persistir `phone`, `cnpj` e `zipCode` com a formatação recebida
- [x] 2.2 Atualizar `updateOrganization` e `organizations.shared.ts` para remover a duplicidade de parsing e manter apenas regras de domínio, serialização e tratamento de conflito
- [x] 2.3 Ajustar a estratégia de conflito de `cnpj` para continuar tratando equivalência semântica mesmo quando o valor persistido preserva pontuação

## 3. Verification

- [x] 3.1 Adicionar ou ajustar testes cobrindo create e update com campos mascarados, whitespace, opcionais vazios e preservação de formatação em `phone`, `cnpj` e `zipCode`
- [x] 3.2 Cobrir conflitos de `cnpj` entre valores semanticamente idênticos com máscaras diferentes
- [x] 3.3 Executar lint, typecheck e testes dos pacotes afetados
