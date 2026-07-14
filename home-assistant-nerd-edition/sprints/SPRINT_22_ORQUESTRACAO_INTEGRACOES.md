# Sprint 22 — Orquestração e integrações

## Objetivo

Desacoplar cenas, automações e providers externos da camada HTTP e do processo web.

## Escopo

- Casos de uso de cenas, automações, sincronização e health check.
- Portas comuns para Tuya, Home Assistant e futuros providers.
- Cofre acessível somente por serviço backend autorizado.
- Scheduler e processamento de eventos desacoplados do Express.
- Outbox para eventos e comandos que exigem durabilidade.

## Critérios de aceite

- Provider externo não é importado pelo domínio ou controller.
- Credencial descriptografada existe somente durante a chamada necessária.
- Reprocessamento é idempotente e não repete comandos confirmados.

## Definition of Done

- [ ] Orquestração e integrações migradas.
- [ ] Outbox, retry e falhas parciais testados.
- [ ] Testes com providers simulados aprovados.
- [ ] Gates DEV e QA aprovados.
