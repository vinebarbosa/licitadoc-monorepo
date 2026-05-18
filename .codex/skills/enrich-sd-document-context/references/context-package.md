# Pacote de Contexto Enriquecido

Use este formato quando for necessário entregar ou preparar contexto para geração documental a partir de uma Solicitação de Despesa. O pacote deve ser genérico e adaptável a qualquer objeto.

## 1. Identificação da SD

Registre apenas dados expressos:

- objeto original;
- município, órgão, unidade ou secretaria;
- responsável e cargo;
- número da solicitação, processo, data e local;
- classificação administrativa informada na SD, se houver.

## 2. Fatos Extraídos

Liste dados literais e verificáveis:

- itens, quantidades, unidades e descrições;
- valores informados ou ausência de valor válido;
- justificativa textual;
- dados orçamentários;
- prazo, local, forma de entrega ou execução;
- observações e anexos relevantes.

Não comprima esta seção a ponto de perder rastreabilidade.

## 3. Objeto Comprimido Semanticamente

Produza uma síntese administrativa do objeto:

- agrupe itens por função;
- elimine repetição literal;
- preserve o núcleo da necessidade;
- destaque se o objeto é simples, híbrido, amplo, recorrente, sensível a prazo ou dependente de execução técnica.

Exemplo de forma: "aquisição de materiais de consumo para reposição operacional", "contratação de serviço recorrente de apoio administrativo" ou "fornecimento de estrutura para evento público". Use apenas quando compatível com a SD.

## 4. Semantic Procurement Classification

Preencha o classificador:

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

Inclua uma nota curta explicando os sinais semânticos usados. Quando houver dúvida, reduza a confiança e registre pendência.

## 5. Inferências Administrativas Contextualizadas

Derive conforme a classificação:

- finalidade administrativa;
- impacto institucional, social, operacional ou de serviço público;
- natureza da execução;
- criticidade e sensibilidade;
- necessidade de continuidade, rastreabilidade ou controle;
- complexidade de fiscalização;
- efeito provável de não contratar, adiar ou reduzir escopo.

Indique o grau de segurança de cada inferência quando houver risco de extrapolação.

## 6. Planejamento Documental Dinâmico

Recomende a densidade e o foco documental:

- documentos necessários ou úteis;
- profundidade recomendada;
- se ETP/TR devem ser robustos ou simplificados;
- se mapa de riscos, critérios técnicos, SLA, medição, controle de entrega ou fiscalização contínua são relevantes;
- pontos que devem aparecer com destaque no DFD, ETP, TR ou minuta.

Não recomende complexidade documental incompatível com objeto simples.

## 7. Tom Administrativo Recomendado

Indique o tom adequado:

- direto e objetivo;
- institucional e proporcional;
- técnico-operacional;
- cauteloso e orientado a risco;
- analítico e robusto.

Explique em uma frase por que esse tom combina com o objeto.

## 8. Alternativas Plausíveis

Liste apenas alternativas compatíveis:

- manter solução proposta;
- ajustar escopo;
- aquisição, locação, execução direta ou contratação externa;
- lote único, parcelamento, agrupamento ou fornecimento centralizado;
- entrega única ou parcelada;
- solução pronta ou montagem interna;
- uso de SRP, ata vigente ou adesão como hipótese a verificar;
- não contratação, adiamento ou reformulação.

Para cada alternativa relevante, indique vantagem, limitação e condição de adoção.

## 9. Riscos e Mitigações

Adapte riscos ao objeto. Exemplos:

- ausência de estimativa válida;
- descrição genérica;
- quantitativo sem memória de cálculo;
- item divergente;
- entrega parcial ou atraso;
- baixa qualidade;
- incompatibilidade técnica ou funcional;
- falha de execução, medição, aceite ou fiscalização;
- falta de controle de entrega a beneficiários;
- ausência de orçamento confirmado;
- risco de perda de utilidade por data sensível.

Associe cada risco a mitigação prática e proporcional.

## 10. Pendências Críticas

Separe pendências por impacto:

- **bloqueadoras**: impedem conclusão segura;
- **relevantes**: devem ser confirmadas antes da contratação;
- **editoriais**: melhoram a qualidade documental.

Pendências devem ser específicas ao objeto. Evite lista genérica igual para todas as SDs.

## 11. Limites de Uso

Finalize com os limites:

- fatos não confirmados;
- inferências que não devem virar afirmações categóricas;
- dados que documentos posteriores não podem inventar;
- pontos que exigem validação administrativa.
