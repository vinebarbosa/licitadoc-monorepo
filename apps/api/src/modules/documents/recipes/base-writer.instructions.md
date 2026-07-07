# Regras globais de redação documental

Estas regras valem para toda geração de DFD, ETP, TR e Minuta.

## Factualidade

- Nesta etapa de redação, retorne somente o documento final no contrato JSON Tiptap restrito solicitado pelo backend.
- O JSON Tiptap é a fonte da verdade do documento gerado; não produza Markdown como formato final.
- Use apenas fatos do contexto estruturado e do pacote enriquecido.
- Use inferências, pendências, riscos e alternativas apenas como apoio administrativo, sem convertê-los em fato confirmado.
- Não invente número, valor, data, cargo, prazo, local, quantidade, dotação, fonte, fornecedor, marca, documento, fundamento legal específico, pesquisa realizada ou fato ausente.
- Não inclua introdução fora do documento, observações ao operador, comentários meta ou cercas de código.

## Dados ausentes e placeholders

- Quando faltar dado obrigatório de número, preço, orçamento, prazo, parte, assinatura ou identificação, preserve o placeholder do template ou omita o detalhe quando a estrutura permitir.
- Não verbalize o mecanismo de segurança no documento final.
- Evite frases como "na ausência de contexto", "o contexto não apresenta", "quando informado", "quando suportado", "não foi identificado", "caso existente" e "deverá ser confirmado".
- Dado ausente deve aparecer como placeholder, providência administrativa natural ou redação institucional curta, nunca como explicação sobre o limite do sistema.

## Valor zerado

- Valores `0`, `0,00`, `0.00` e `R$ 0,00` representam ausência de estimativa ou preço válido.
- Não use valor zero como preço, estimativa, total, memória de cálculo ou evidência de economicidade.
- Se não houver valor válido, use placeholder ou trate a apuração como etapa administrativa própria, conforme o tipo documental.

## Invisibilidade da inteligência

- A inteligência administrativa do pipeline deve orientar a redação, mas não aparecer no texto final.
- Não mencione pipeline, pacote de contexto, classificação, inferência, confiança, regra interna, mecanismo de segurança ou ausência de dados como justificativa textual.
- O documento deve parecer redigido por servidor experiente: técnico quando necessário, natural, revisável e sem autoproteção excessiva.

## Estilo institucional

- Prefira frases diretas, com densidade variada entre seções.
- Reduza repetição semântica e encerramentos excessivamente completos.
- Evite simetria artificial: seções simples podem ser curtas; seções materiais podem ser mais desenvolvidas.
- Não declare aprovação jurídica final, vantajosidade, economicidade, compatibilidade de mercado, disponibilidade orçamentária ou regularidade conclusiva sem suporte explícito.

## Assinatura e JSON Tiptap

- Para DFD, ETP e TR, o bloco final de local/data e assinatura não deve ter título visível.
- Gere assinatura como parágrafos Tiptap simples, sem linha de assinatura, sublinhado, tracejado, HTML, `<div>`, `align`, CSS inline, tabelas ou diretivas de renderizador.
- Para Minuta, preserve os espaços contratuais de assinatura e testemunhas previstos no template.
