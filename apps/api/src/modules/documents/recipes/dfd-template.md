# DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)

## 1. DADOS DA SOLICITAÇÃO

- Unidade Orçamentária: {{department.budgetUnitCode}} - {{department.name}}
- Número da Solicitação: {{process.externalId_or_sourceRequestNumber}}
- Data de Emissão: {{process.issuedAt_br}}
- Processo: {{process.type}}
- Objeto da Solicitação: {{process.object}}
- Solicitante: {{department.name_or_organization.name}}
- Responsável pela Solicitação: {{process.responsibleName}}

## 2. CONTEXTO E NECESSIDADE DA DEMANDA

Texto corrido, em tom administrativo formal, normalmente em 1 ou 2 parágrafos, explicando de forma objetiva:

- o contexto institucional da contratação
- a necessidade administrativa inicial
- o problema concreto que precisa ser resolvido
- o impacto de não atender à necessidade

Não desenvolva análise estratégica ampla, estudo de viabilidade, riscos detalhados ou conclusão técnica própria de ETP.

## 3. OBJETO DA CONTRATAÇÃO

Descreva com clareza, normalmente em 1 ou 2 parágrafos:

- o objeto específico da contratação
- o resultado esperado
- o recorte temporal, operacional ou de execução quando estiver informado no contexto
- a relação direta entre o objeto e a necessidade administrativa

Não aprofunde requisitos técnicos, planejamento de execução, fiscalização ou cláusulas típicas de TR.

## 4. JUSTIFICATIVA E RELEVÂNCIA DA CONTRATAÇÃO

Apresente justificativa inicial, suficiente e revisável, normalmente em 1 ou 2 parágrafos, cobrindo:

- interesse público envolvido
- relevância administrativa, social, cultural, técnica ou econômica compatível com o objeto
- benefícios esperados para a administração e para a população
- impacto de não contratação quando ainda não tratado na seção anterior

Não declare economicidade comprovada, vantajosidade, compatibilidade com mercado, legalidade conclusiva ou fundamento jurídico específico não informado. Se o valor estiver ausente ou pendente, registre apenas que será apurado em etapa posterior.

## 5. REQUISITOS ESSENCIAIS PARA A CONTRATAÇÃO

Liste de 3 a 6 requisitos essenciais em bullets curtos e objetivos, adequados à natureza do objeto do processo.

Os requisitos devem ser mínimos, diretamente ligados ao objeto e compatíveis com a demanda informada. Não copie requisitos de outras categorias de objeto.

Não inclua cláusulas contratuais detalhadas, obrigações extensas, critérios de fiscalização, critérios de pagamento, critérios de medição, SLA, sanções, certificações sem suporte, padrões técnicos não informados ou exigências excessivamente específicas sem base no contexto.

## 6. FECHO

{{organization.city}}/{{organization.state}}, {{process.issuedAt_long_br}}.

{{process.responsibleName}}

{{department.responsibleRole_or_sourceResponsibleRole_or_fallback}}
