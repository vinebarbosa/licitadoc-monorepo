## 1. Preparar persistência e configuração

- [x] 1.1 Evoluir o schema `documents` para suportar rascunhos gerados com `type`, `status`, conteúdo textual e referência opcional de arquivo, além de criar o schema `document_generation_runs` para histórico de execuções
- [x] 1.2 Gerar a migration correspondente, atualizar os re-exports do schema e ajustar o plugin de env com chaves genéricas de configuração para `TEXT_GENERATION_PROVIDER`, `TEXT_GENERATION_MODEL` e `TEXT_GENERATION_API_KEY`
- [x] 1.3 Registrar um plugin compartilhado de generation provider no Fastify para expor o adaptador ativo à camada de serviços sem acoplamento a um vendor específico

## 2. Implementar a abstração de provedor

- [x] 2.1 Definir o contrato normalizado de entrada, saída e erro para geração de texto em uma camada compartilhada reutilizável
- [x] 2.2 Implementar o primeiro adaptador compatível com OpenAI por trás desse contrato genérico, preservando campos neutros como `providerKey` e `model`
- [x] 2.3 Cobrir com testes a resolução do provedor ativo e a normalização de falhas como timeout, rate limit e erro de autenticação

## 3. Implementar o fluxo de geração documental

- [x] 3.1 Expandir os schemas Zod e as rotas do módulo `documents` para solicitar geração, listar documentos e ler detalhes com `type`, `status`, `processId` e conteúdo do rascunho
- [x] 3.2 Implementar os serviços do módulo `documents` para resolver o `processId`, validar escopo organizacional, montar o contexto de geração com dados de organização e processo, criar os registros de documento e execução, chamar o provedor e persistir estados `generating`, `completed` e `failed`
- [x] 3.3 Ajustar policies e helpers compartilhados do módulo `documents` para reaproveitar as regras de visibilidade por organização e manter cada documento vinculado a um único processo
- [x] 3.4 Adicionar testes de módulo cobrindo geração bem-sucedida, tipo de documento inválido, acesso fora do escopo da organização e persistência do estado de falha

## 4. Validar contrato e integração

- [x] 4.1 Adicionar cobertura E2E para request de geração, leitura de detalhe, listagem visível por ator e comportamento de status em falhas do provedor
- [x] 4.2 Regenerar OpenAPI, Postman e `packages/api-client` para refletir o novo contrato de geração documental
- [x] 4.3 Executar as verificações relevantes dos pacotes afetados, incluindo lint, typecheck, testes unitários e testes E2E
