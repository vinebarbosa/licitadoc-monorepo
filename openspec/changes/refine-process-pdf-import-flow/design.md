## Context

A change `add-process-creation-form-pdf-prefill` criou a pagina `/app/processo/novo`, com formulario manual e importacao de PDF TopDown no proprio corpo da pagina. Na pratica, a importacao ficou visualmente dominante: um card inteiro aparece antes dos dados principais do processo. O produto precisa que a importacao seja percebida como uma ajuda opcional, nao como o fluxo principal.

Tambem ha um problema funcional: ao importar `/Users/vine/Downloads/SD.pdf`, o frontend exibe erro generico. O backend, usando `extractTextFromPdf` e `parseExpenseRequestText`, consegue extrair esse mesmo arquivo e derivar `SD-6-2026`, CNPJ `08.290.223/0001-42`, unidade `06.001`, tipo `Servico`, objeto, justificativa e responsavel. Isso mostra que o arquivo e valido e que a falha esta na experiencia/paridade do frontend.

## Goals / Non-Goals

**Goals:**

- Tornar a importacao uma acao discreta do formulario, acionada por um botao "Importar SD" ou equivalente.
- Abrir a importacao em um dialog com selecao de arquivo, progresso, diagnostico, preview de campos extraidos e acao explicita para aplicar ao formulario.
- Fazer o `SD.pdf` real do TopDown usado pelo usuario importar com sucesso quando o backend tambem conseguir ler o arquivo.
- Reduzir divergencia entre parser frontend e parser backend, especialmente nas regras de texto extraido e campos obrigatorios.
- Exibir erros especificos para leitura de PDF, parser de SD, campos obrigatorios ausentes e falta de match com organizacao/departamento.
- Manter o envio final pelo formulario revisado e pelo endpoint manual `POST /api/processes/`.

**Non-Goals:**

- Criar endpoint novo para preview ou parse.
- Reintroduzir criacao direta por `POST /api/processes/from-expense-request/pdf` nesta tela.
- Persistir o arquivo PDF bruto.
- Redesenhar toda a tela de criacao de processo.
- Mudar regras backend de autorizacao, escopo, validacao ou conflito de numero.

## Decisions

### Decision: Importacao vira dialog, nao card persistente

A pagina deve manter foco no formulario. O cabecalho pode expor um botao secundario "Importar SD" com icone de upload, e o dialog concentra a operacao de arquivo. Apos aplicar, a pagina mostra apenas um resumo compacto, como "Dados importados de SD.pdf", com possibilidade de reabrir/substituir.

Alternativas consideradas:

- Manter card fixo e reduzir altura: melhora pouco, ainda prioriza a importacao acima do formulario.
- Usar drawer lateral: ocupa mais espaco mental e e excessivo para uma acao pontual.

### Decision: Dialog tem etapa de preview antes de aplicar

Selecionar o PDF nao deve alterar imediatamente campos ja preenchidos. O dialog deve mostrar quais campos seriam preenchidos e quais avisos existem. A aplicacao ao formulario deve acontecer apenas quando o usuario confirmar.

Alternativas consideradas:

- Aplicar automaticamente ao selecionar o arquivo: rapido, mas aumenta risco de sobrescrever edicoes e dificulta entender o que mudou.
- Fazer upload direto sem preview: contradiz o objetivo de revisar antes de criar.

### Decision: Frontend deve reproduzir comportamento observavel do backend

A implementacao deve usar o `SD.pdf` real como fixture de regressao e comparar os campos essenciais com o resultado esperado do backend. A prioridade nao e copiar codigo de `apps/api` diretamente para `apps/web`, mas alinhar regras: limpeza de texto, marcadores de secao, extracao de data, classificacao/objeto, justificativa e responsavel.

Alternativas consideradas:

- Aceitar parser frontend mais permissivo e diferente: mantem risco de erro invisivel e dificulta suporte.
- Criar pacote compartilhado agora: pode ser bom no futuro, mas esta change deve focar a correcao no modulo web sem reestruturar monorepo.

### Decision: Erros devem preservar causa tecnica em estado de UI testavel

O catch atual transforma falhas diferentes em mensagem generica. A nova abordagem deve classificar a falha em categorias apresentaveis: arquivo invalido, leitura PDF falhou, texto vazio, SD sem campos obrigatorios, organizacao/departamento nao encontrados. A UI pode mostrar linguagem amigavel, mas os testes precisam conseguir validar a categoria.

Alternativas consideradas:

- Mostrar somente a excecao bruta: pode expor texto tecnico demais ao usuario.
- Manter uma mensagem unica: impede saber se o usuario deve trocar arquivo, preencher manualmente ou configurar departamento/organizacao.

## Risks / Trade-offs

- [Risk] A paridade com o backend pode voltar a divergir. -> Mitigacao: adicionar fixture real do TopDown e testes com campos esperados do backend.
- [Risk] Um dialog com preview pode adicionar um clique a mais. -> Mitigacao: o fluxo fica mais seguro e menos intrusivo; a acao de aplicar e clara.
- [Risk] O arquivo real pode conter dados sensiveis. -> Mitigacao: manter fixture minimizada/sanitizada quando possivel; se usar fixture binaria real, limitar ao repositorio apenas se o usuario confirmar que pode versionar.
- [Risk] Corrigir apenas o front ainda duplica logica. -> Mitigacao: manter o escopo curto agora e registrar eventual pacote compartilhado como evolucao futura.
