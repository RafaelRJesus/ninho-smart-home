---
name: observability
description: Padroniza logs, métricas, tracing, dashboards e alertas.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Permitir diagnóstico rápido, acompanhamento operacional e identificação de degradação.

# Quando usar

Use em APIs, integrações, filas, comandos, automações e eventos.

# Entradas esperadas

- Operações
- Métricas técnicas
- Métricas de negócio
- SLIs/SLOs

# Regras obrigatórias

- Usar logs estruturados.
- Incluir correlationId.
- Medir latência, erro e disponibilidade.
- Criar alertas acionáveis.
- Não registrar secrets.

# Saídas esperadas

- Logs
- Métricas
- Traces
- Dashboards
- Alertas

# Restrições

Evitar alto volume sem valor. Definir retenção e mascaramento.

# Checklist de conclusão

- [ ] CorrelationId
- [ ] Dashboard
- [ ] Alertas
- [ ] Métricas de negócio
- [ ] Sem dados sensíveis
