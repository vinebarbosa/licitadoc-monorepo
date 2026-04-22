# DOCUMENTO DE FORMALIZACAO DE DEMANDA (DFD)

## 1. DADOS DA SOLICITACAO

- Unidade Orcamentaria: `{{department.budgetUnitCode}} - {{department.name}}`
- Numero da Solicitacao: `{{process.externalId_or_sourceRequestNumber}}`
- Data de Emissao: `{{process.issuedAt_br}}`
- Processo: `{{process.type}}`
- Objeto da Solicitacao: `{{process.object}}`
- Solicitante: `{{department.name_or_organization.name}}`
- Responsavel pela Solicitacao: `{{process.responsibleName}}`

## 2. CONTEXTO E NECESSIDADE DA DEMANDA

Texto corrido, em tom administrativo formal, explicando:

- o contexto institucional da contratacao
- a relevancia publica da demanda
- o problema concreto que precisa ser resolvido
- o impacto de nao atender a necessidade

## 3. OBJETO DA CONTRATACAO

Descreva com clareza:

- o objeto especifico da contratacao
- o resultado esperado
- o recorte temporal, operacional ou de execucao aplicavel
- a aderencia entre o objeto e a finalidade publica do processo

## 4. JUSTIFICATIVA E RELEVANCIA DA CONTRATACAO

Apresente justificativa substantiva e revisavel, cobrindo:

- interesse publico envolvido
- relevancia tecnica, social, cultural, economica ou administrativa
- beneficios esperados para a administracao e para a populacao
- compatibilidade da contratacao com legalidade, eficiencia e economicidade

## 5. REQUISITOS ESSENCIAIS PARA A CONTRATACAO

Liste requisitos essenciais em bullets curtos e objetivos, adequados ao objeto do processo.

## 6. FECHO

`{{organization.city}}/{{organization.state}}, {{process.issuedAt_long_br}}.`

`{{process.responsibleName}}`

`{{department.responsibleRole_or_sourceResponsibleRole_or_fallback}}`
