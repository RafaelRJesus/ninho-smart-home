# Sprint 23 — Energia, notificações e observabilidade

## Objetivo

Concluir a migração funcional e obter rastreabilidade ponta a ponta dos fluxos críticos.

## Escopo

- Casos de uso e políticas de energia e notificações.
- Preferências, agregações e alertas preservados no novo desenho.
- Logs estruturados com ator, residência, request e correlation ID.
- Métricas por caso de uso e provider.
- Tracing de comando do frontend até a confirmação externa.
- Alertas para autenticação anormal, integrações e automações.

## Critérios de aceite

- Toda mutação relevante pode ser rastreada sem expor dados pessoais ou secrets.
- Métricas e traces preservam segregação entre residências.
- Alertas operacionais possuem runbook e limiares testados.

## Definition of Done

- [ ] Energia e notificações migradas.
- [ ] Tracing e métricas implantados.
- [ ] Testes de privacidade de logs e alarmes aprovados.
- [ ] Gates DEV e QA aprovados.

