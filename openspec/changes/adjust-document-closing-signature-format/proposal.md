## Why

Os documentos gerados hoje encerram DFD, ETP e TR com uma seção visível `FECHO`, seguida por data/local, nome e cargo como parágrafos comuns. Esse formato não corresponde ao padrão esperado para assinatura: o fecho deve aparecer como bloco final sem título, com data/local alinhados à direita e identificação do responsável centralizada sob uma linha de assinatura.

## What Changes

- Remover o título visível `FECHO` dos templates canônicos de DFD, ETP e TR.
- Padronizar o bloco final desses documentos para exibir local/data alinhados à direita.
- Incluir uma linha de assinatura acima do nome do responsável.
- Centralizar o nome do responsável e o cargo abaixo da linha de assinatura.
- Ajustar instruções, conversão/preview quando necessário e testes para que o bloco final preserve essa formatação de forma determinística.
- Manter a mudança restrita aos documentos administrativos gerados; a minuta contratual não entra no escopo deste ajuste.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `document-generation-recipes`: passa a exigir templates/instruções de DFD, ETP e TR com bloco final de assinatura sem título `FECHO`, com data/local à direita, linha de assinatura, nome e cargo centralizados.
- `document-generation`: passa a persistir e expor os rascunhos gerados com estrutura de fecho/assinatura renderizável, preservando o alinhamento e a linha de assinatura no preview.

## Impact

- Afeta os templates em `apps/api/src/modules/documents/recipes`.
- Pode exigir ajuste na conversão Markdown -> Tiptap JSON em `apps/api/src/shared/tiptap-json.ts` para representar alinhamento e linha de assinatura no conteúdo persistido.
- Pode exigir ajuste no preview/editor de documentos para renderizar o novo bloco sem depender de um heading `FECHO`.
- Atualiza testes de receitas, geração e preview que hoje esperam `## FECHO` ou usam o heading como marcador de assinatura.
- Não requer migração de banco, alteração de contrato público de API ou nova dependência.
