---
name: enrich-sd-document-context
description: Enriquecer genericamente o contexto de geração documental do Licitadoc a partir de uma Solicitação de Despesa como única fonte estruturada. Use quando Codex precisar interpretar semanticamente qualquer SD, classificar a natureza da contratação, comprimir o objeto, inferir contexto administrativo e planejar documentos como DFD, ETP, TR, minuta, justificativas ou análises de risco sem assumir tipo fixo de contratação.
---

# Enriquecimento Semântico de SD

Use esta skill como motor genérico de interpretação administrativa para Solicitações de Despesa (SD). A SD é a única fonte estruturada obrigatória nesta versão MVC/MVP.

O trabalho é interpretar semanticamente o objeto antes de inferir. Não assuma que a SD trata de serviço, compra, dispensa, contratação continuada, tecnologia, assessoria, evento, material administrativo ou qualquer padrão fixo.

## Princípio Central

Classifique antes de enriquecer:

```text
Solicitação de Despesa
        ↓
Classificação semântica do objeto
        ↓
Compressão semântica do conteúdo
        ↓
Inferência administrativa contextual
        ↓
Planejamento documental dinâmico
        ↓
Geração estruturada ou orientação de geração
```

Trabalhe sempre com três camadas separadas:

1. **Fatos extraídos**: dados expressos na SD.
2. **Inferências contextualizadas**: conclusões prudentes derivadas da classificação semântica e do objeto.
3. **Pendências**: lacunas que não podem ser preenchidas por suposição.

Nunca apresente inferência como fato confirmado. Nunca invente preço, pesquisa de mercado, dotação, fonte, prazo, local, fornecedor, marca, público atendido, quantidade, fundamento legal específico, modalidade de contratação ou condição operacional não informada.

## Fluxo de Trabalho

### 1. Normalizar a SD

Extraia os dados disponíveis sem ainda interpretar a natureza da contratação:

- objeto, descrição da demanda e justificativa;
- órgão, município, unidade administrativa, secretaria ou setor requisitante;
- responsável, cargo, local, data, número da solicitação e processo, se existirem;
- itens, quantidades, unidades, descrições, valores e total;
- dotação, fonte, programa, ação ou dados orçamentários;
- prazos, datas, locais de entrega/execução e condições mencionadas;
- observações e anexos textuais.

Trate valores `0`, `0,00`, `0.00` ou `R$ 0,00` como ausência de estimativa, não como preço válido.

### 2. Aplicar o Semantic Procurement Classifier

Classifique a SD usando o esquema abaixo. Use `mixed` quando o objeto combinar naturezas relevantes ou quando a classificação principal não for suficiente.

```ts
type ProcurementClassification = {
  procurementType:
    | "goods"
    | "service"
    | "engineering"
    | "event"
    | "social_action"
    | "continuous_service"
    | "technical_service"
    | "institutional_action"
    | "consumable_material"
    | "permanent_asset"
    | "mixed"

  operationalNature:
    | "continuous"
    | "one_time"
    | "seasonal"
    | "recurring"

  executionComplexity:
    | "low"
    | "medium"
    | "high"

  publicInterestProfile:
    | "internal_administration"
    | "direct_public_service"
    | "institutional"
    | "social"
    | "operational_support"

  probableLegalPath:
    | "dispensa"
    | "pregao"
    | "credenciamento"
    | "concorrencia"
    | "undefined"

  confidence: number
}
```

Regras de classificação:

- Defina `probableLegalPath` como `undefined` quando a SD não trouxer dado suficiente. Não presuma dispensa, pregão ou concorrência apenas pelo objeto.
- Use confiança baixa ou média quando o objeto for genérico, híbrido ou mal descrito.
- A classificação deve orientar profundidade, riscos, alternativas e tom. Ela não deve criar fatos.
- Consulte `references/inference-rubric.md` quando a classificação for ambígua.

### 3. Acionar o Semantic Compression Engine

Comprima semanticamente o objeto antes de escrever análises documentais:

- agrupe itens equivalentes por função administrativa;
- preserve itens, quantidades e valores na camada de fatos;
- substitua repetição literal por síntese conceitual;
- mantenha rastreabilidade entre síntese e SD;
- não apague itens relevantes para preço, escopo, fiscalização ou risco.

Exemplo de compressão: listas de itens físicos relacionados podem virar uma síntese como "materiais destinados à composição de conjunto funcional para uso administrativo ou ação pública", desde que a lista original permaneça disponível como fato extraído.

### 4. Acionar a Contextual Administrative Intelligence

Depois da classificação, derive somente o que for compatível com o objeto:

- finalidade administrativa;
- impacto institucional, social, operacional ou de serviço público;
- natureza operacional;
- sensibilidade temporal, técnica, social, sanitária, patrimonial, financeira ou logística;
- necessidade de continuidade, disponibilidade, controle, rastreabilidade ou fiscalização;
- criticidade operacional;
- risco de execução;
- complexidade de recebimento, aceite, medição ou acompanhamento;
- pontos que precisam ser confirmados para uma contratação segura.

Não use a mesma régua para todos os objetos. Uma compra pontual de material de consumo não exige a mesma profundidade de um serviço continuado, obra, tecnologia crítica ou fornecimento essencial.

### 5. Acionar o Dynamic Document Planning

Planeje a documentação conforme classificação e risco:

- objetos simples ou baixo risco: contexto objetivo, TR ou justificativa mais enxutos, pesquisa de preços e riscos proporcionais;
- bens comuns: especificação, quantidade, unidade, entrega, recebimento, armazenamento e garantia quando cabível;
- distribuição gratuita ou ação social: público/critério/quantitativo como pendências críticas se ausentes, controle de entrega e finalidade administrativa;
- eventos e ações institucionais: calendário, local, logística, estrutura, público, comunicação e risco de perda de utilidade por atraso;
- serviços continuados ou técnicos: escopo, entregáveis, periodicidade, evidência de execução, fiscalização, transição e controle de dependência;
- obras e engenharia: local, projeto, responsabilidade técnica, medição, segurança e cronograma apenas quando houver suporte;
- tecnologia: disponibilidade, suporte, integração, segurança, dados, continuidade, migração e treinamento quando compatíveis.

Use `references/context-package.md` quando precisar entregar um pacote completo de contexto enriquecido.

### 6. Acionar o Administrative Tone Engine

Adapte o tom ao objeto:

- objetos simples: administrativo, direto e proporcional;
- eventos, campanhas e ações sociais: institucional, objetivo e menos técnico-operacional;
- serviços técnicos ou continuados: analítico, operacional e mais robusto;
- obras, engenharia, saúde ou tecnologia crítica: cauteloso, técnico e orientado a risco;
- compras rotineiras: claro, econômico e focado em recebimento, quantidade e uso.

Evite linguagem genérica independente do objeto. Evite aparência de template.

## Critérios de Qualidade

O contexto enriquecido deve:

- interpretar semanticamente a SD antes de inferir;
- variar profundidade conforme complexidade, risco e impacto;
- adaptar riscos, alternativas e tom ao objeto;
- produzir abstrações administrativas sem perder rastreabilidade;
- reduzir repetição literal da SD;
- separar fato, inferência e pendência;
- manter comportamento anti-alucinação;
- registrar fragilidades reais antes de recomendar prosseguimento.

## Anti-Padrões

Não:

- assumir natureza fixa de contratação;
- assumir continuidade, serviço técnico, dispensa, TI, assessoria ou material administrativo;
- usar uma estrutura analítica idêntica para todos os casos;
- repetir a SD quase literalmente como se fosse análise;
- transformar ausência de dado em texto longo e abstrato;
- afirmar pesquisa de preços, economicidade, dotação, modalidade ou disponibilidade orçamentária sem evidência;
- tratar exemplos anteriores como padrão dominante.

## Quando Perguntar ao Usuário

Pergunte apenas quando a decisão for indispensável para continuar a tarefa atual.

Quando a lacuna puder ser tratada documentalmente, registre como pendência. Exemplo: se a SD de distribuição gratuita não informar público-alvo, não invente beneficiários; marque público e critério de distribuição como pendências críticas.

## Saída Recomendada

Ao finalizar um enriquecimento, entregue ou use internamente:

- fatos extraídos;
- objeto comprimido semanticamente;
- classificação semântica;
- inferências administrativas contextualizadas;
- planejamento documental;
- tom recomendado;
- riscos e condicionantes;
- alternativas plausíveis;
- pendências críticas;
- limites de uso.

Mantenha a redação técnica, direta e revisável por equipe pública.
