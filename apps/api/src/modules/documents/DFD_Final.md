# 🧠 DFD — Arquitetura de Contexto
### Front → Backend → IA (versão corrigida com template)

---

## 📌 1. Dados da Solicitação
**Tipo:** FIXO  
**IA:** ❌

### 🟢 Front
```json
{
  "templateId": "inexigibilidade_apresentacao_artistica",
  "unidadeOrcamentaria": "06.001 – Secretaria Municipal de Educação, Cultura, Esporte e Lazer",
  "numeroSolicitacao": 6,
  "dataEmissao": "2026-01-08",
  "objetoNome": "Banda FORRÓ TSUNAMI",
  "solicitante": "Secretaria Municipal de Educação, Cultura, Esporte e Lazer",
  "responsavel": "Maria Marilda Silva da Rocha",
  "municipio": "Pureza"
}
```

### 🟡 Backend
```json
{
  "tipoProcesso": "servico",
  "tipoContratacao": "inexigibilidade",
  "categoriaObjeto": "apresentacao_artistica"
}
```

---

## 🤖 2. Contexto e Necessidade
**Tipo:** IA  
**IA:** ✅

### 🟢 Front
```json
{
  "municipio": "Pureza",
  "eventoNome": "Carnaval de Pureza 2026"
}
```

### 🟡 Backend
```json
{
  "tipoEvento": "carnaval",
  "naturezaDemanda": "evento cultural público",
  "impactos": ["cultural", "social", "economico"],
  "objetivoPublico": "promover lazer, cultura e dinamização da economia local"
}
```

---

## ⚙️ 3. Objeto da Contratação
**Tipo:** MISTO  
**IA:** ✅

### 🟢 Front
```json
{
  "objetoNome": "Banda FORRÓ TSUNAMI",
  "municipio": "Pureza",
  "localExecucao": "Município de Pureza/RN",
  "dataInicio": "2026-02-13",
  "dataFim": "2026-02-17",
  "duracaoApresentacao": "2 horas"
}
```

### 🟡 Backend
```json
{
  "subtipo": "show_musical",
  "naturezaObjeto": "servico_artistico",
  "finalidadeGenerica": "apresentação artística em evento público",
  "classificacao": "contratacao_de_atracao_artistica"
}
```

---

## 🔥 4. Justificativa e Relevância
**Tipo:** IA FORTE  
**IA:** ✅

### 🟢 Front
```json
{
  "municipio": "Pureza",
  "eventoNome": "Carnaval de Pureza 2026"
}
```

### 🟡 Backend
```json
{
  "impactos": ["cultural", "social", "economico"],
  "motivoEscolha": "atração com reconhecimento público e compatibilidade com o evento",
  "beneficioEsperado": "maior participação popular e fortalecimento da economia local",
  "riscoNaoContratar": "redução da atratividade do evento e menor engajamento do público",
  "interessePublico": true
}
```

---

## 🔒 5. Requisitos Essenciais
**Tipo:** FIXO  
**IA:** ❌

### 🟢 Front
```json
{}
```

### 🟡 Backend
```json
{
  "templateId": "requisitos_apresentacao_artistica"
}
```

---

# 📊 Resumo

| Tópico | Tipo | IA |
|------|-----|----|
| Dados | FIXO | ❌ |
| Contexto | IA | ✅ |
| Objeto | MISTO | ✅ |
| Justificativa | IA FORTE | ✅ |
| Requisitos | FIXO | ❌ |

---

# 🧠 Regra do Sistema

```
Front → envia fatos reais do processo  
Backend → define enquadramento e contexto genérico  
IA → gera texto jurídico  
```
