# Rubrica Genérica de Inferência Semântica

Use esta referência para interpretar qualquer Solicitação de Despesa sem importar padrões de exemplos anteriores.

## Lei de Ouro

Nenhuma inferência vem antes da classificação semântica. Primeiro identifique o que o objeto é; depois decida quais riscos, alternativas, documentos e tom fazem sentido.

## Escala de Confiança

- **Confirmado**: está escrito na SD.
- **Inferido com segurança**: decorre diretamente do objeto, dos itens, da unidade ou da justificativa.
- **Hipótese administrativa**: é plausível, mas deve ser apresentada como possibilidade ou pendência.
- **Não inferível**: não deve ser afirmado nem usado como base conclusiva.

## Sinais de Classificação

### goods

Sinais: aquisição, compra, fornecimento, itens físicos, unidades, entrega, armazenamento, garantia.

Foco: especificação, quantidade, unidade, entrega, recebimento, integridade, armazenamento e substituição.

### consumable_material

Sinais: material de uso imediato, reposição, expediente, limpeza, alimentação, medicamentos, combustível, insumos.

Foco: consumo previsto, controle de estoque, validade quando aplicável, entrega, armazenamento e justificativa do quantitativo.

### permanent_asset

Sinais: equipamento, mobiliário, bem durável, patrimônio, tombamento, instalação, garantia.

Foco: incorporação patrimonial, instalação, garantia, manutenção, compatibilidade e responsabilidade pelo uso.

### service

Sinais: prestação, execução, apoio, manutenção, transporte, limpeza, capacitação, atendimento ou atividade por terceiro.

Foco: escopo, entregáveis, evidência de execução, aceite, obrigações, fiscalização e periodicidade.

### continuous_service

Sinais: execução mensal, rotina permanente, 12 meses, necessidade recorrente, interrupção prejudicial.

Foco: continuidade, medição, substituição, transição, fiscalização contínua, dependência operacional e comprovação periódica.

### technical_service

Sinais: assessoria, consultoria, laudo, projeto, parecer, suporte especializado, treinamento, análise técnica.

Foco: qualificação do escopo, produtos técnicos, limites da assessoria, responsabilidades públicas, evidências e controle de dependência.

### engineering

Sinais: obra, reforma, manutenção predial, projeto, ART/RRT, medição, intervenção física, engenharia.

Foco: local, projeto, responsabilidade técnica, cronograma, segurança, medições, impacto na unidade e conformidade técnica.

### event

Sinais: festa, programação, comemoração, cerimônia, apresentação, estrutura de evento, data marcada.

Foco: calendário, local, estrutura, logística, público, montagem/desmontagem, perda de utilidade por atraso.

### social_action

Sinais: distribuição gratuita, beneficiários, campanha, ação social, atendimento comunitário, entrega à população.

Foco: público-alvo, critério de distribuição, justificativa do quantitativo, controle de entrega, transparência e risco de direcionamento.

### institutional_action

Sinais: ação comemorativa, campanha pública, solenidade, comunicação institucional, brindes ou materiais promocionais.

Foco: finalidade administrativa, proporcionalidade, controle de quantidade, vedação de personalismo e utilidade pública indireta.

### mixed

Use quando o objeto combinar componentes relevantes, como evento com locação e serviços, kits com distribuição social, obra com fornecimento de equipamentos, ou serviço técnico com tecnologia.

Foco: separar subnaturezas e evitar aplicar uma única régua ao objeto todo.

## Natureza Operacional

- **one_time**: demanda pontual, entrega única, objeto consumado em ato específico.
- **seasonal**: vinculado a data, campanha, período letivo, festividade ou ciclo anual.
- **recurring**: se repete periodicamente, mas não necessariamente de forma contínua.
- **continuous**: suporte permanente ou mensal cuja interrupção prejudica rotina administrativa ou serviço público.

Não use `continuous` apenas porque há quantidade de meses. Verifique se há necessidade operacional de continuidade.

## Complexidade de Execução

- **low**: bem comum, entrega simples, baixo risco técnico, fiscalização objetiva.
- **medium**: múltiplos itens, logística, prazo sensível, execução por terceiro, controle de beneficiários ou suporte recorrente.
- **high**: obra, tecnologia crítica, saúde, serviço essencial, alto risco técnico, medição complexa, continuidade sensível ou grande impacto.

## Perfil de Interesse Público

- **internal_administration**: funcionamento interno, gestão, expediente, RH, patrimônio, sistemas administrativos.
- **direct_public_service**: impacta diretamente serviço entregue ao cidadão, como saúde, educação, transporte, assistência ou infraestrutura.
- **institutional**: ato, campanha, comemoração, identidade institucional ou comunicação pública.
- **social**: distribuição, atendimento comunitário, vulnerabilidade ou beneficiários.
- **operational_support**: suporte logístico, manutenção, insumos ou estrutura para viabilizar outras atividades.

## Caminho Legal Provável

Mantenha `probableLegalPath` como `undefined` salvo quando houver indício suficiente na SD ou no pedido do usuário.

Pode ser hipótese, nunca conclusão, quando:

- bem ou serviço comum sugere pregão, mas depende de valor, mercado e definição do objeto;
- baixo valor pode sugerir dispensa, mas valor válido e enquadramento precisam existir;
- obra ou serviço de engenharia pode sugerir concorrência ou outro rito, mas depende do caso;
- credenciamento só deve aparecer quando o próprio objeto indicar pluralidade de interessados e contratação paralela possível.

Nunca afirme modalidade, enquadramento legal ou fundamento específico sem suporte.

## Inferências Permitidas por Contexto

### Sempre seguras quando compatíveis

- valor zerado indica ausência de estimativa válida;
- item físico exige recebimento e conferência;
- serviço exige evidência de execução e aceite;
- data sensível aumenta risco de atraso;
- distribuição a beneficiários exige critério e controle;
- objeto técnico exige delimitação de escopo e entregáveis;
- ausência de orçamento exige confirmação pela unidade competente.

### Exigem cautela

- público-alvo;
- quantidade de beneficiários;
- local de entrega;
- prazo específico;
- fornecedor apto;
- disponibilidade orçamentária;
- economicidade;
- modalidade de licitação;
- exclusividade, singularidade ou inviabilidade de competição;
- obrigação legal específica.

## Semantic Compression Engine

Comprima sem apagar:

- mantenha itens literais na seção de fatos;
- crie uma frase-síntese do objeto;
- agrupe por função, não por conveniência textual;
- preserve diferenças que afetam preço, risco ou fiscalização;
- evite repetir blocos longos da SD no documento final.

Teste mental: se um auditor precisar rastrear a síntese até a SD, isso ainda é possível?

## Dynamic Document Planning

Use a classificação para calibrar documentos:

- **baixo risco e objeto simples**: análise objetiva, riscos enxutos, TR simplificado, pesquisa de preços.
- **bens múltiplos ou kits**: composição, agrupamento, recebimento, controle e compatibilidade.
- **serviço técnico**: escopo, produtos, qualificação da entrega, limites, aceite e fiscalização.
- **serviço contínuo**: continuidade, medição, substituição, transição, periodicidade e controle.
- **evento/ação sazonal**: tempestividade, logística, estrutura, público, perda de utilidade por atraso.
- **ação social/distribuição**: público, critério, quantitativo, controle e transparência.
- **obra/engenharia**: projeto, local, responsabilidade técnica, medição e segurança.
- **tecnologia**: integração, suporte, disponibilidade, segurança, dados, migração e continuidade.

## Administrative Tone Engine

Adapte o tom:

- compra comum: direto, econômico, objetivo;
- material de consumo: administrativo, prático, focado em uso e estoque;
- bem permanente: patrimonial e operacional;
- evento ou ação institucional: institucional, sóbrio e proporcional;
- ação social: público-social, cuidadoso e orientado a controle;
- serviço técnico: analítico e operacional;
- serviço contínuo: robusto e orientado a fiscalização;
- engenharia, saúde ou tecnologia crítica: técnico, cauteloso e orientado a risco.

## Red Flags

Registre pendência crítica quando houver:

- objeto amplo demais para pesquisa de preços;
- valor zerado ou ausente;
- quantitativo sem base;
- classificação ambígua;
- modalidade presumida sem dados;
- ação com público destinatário sem critério;
- evento sem data ou local;
- serviço sem escopo, entregável ou periodicidade;
- obra sem local, projeto ou responsabilidade técnica;
- tecnologia sem requisito de suporte, segurança ou continuidade;
- conclusão forte de viabilidade sem estimativa, orçamento ou escopo suficiente.
