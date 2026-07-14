# Sprint 18 — Persistência modular

## Objetivo

Substituir repositórios monolíticos por portas coesas e transações explícitas.

## Escopo

- Repositórios separados para residência, cômodo, dispositivo, planta, cena, automação, energia, notificação, credencial e auditoria.
- Implementações PostgreSQL e memória equivalentes.
- Unidade de trabalho para operações multiagregado.
- Migrações reversíveis, constraints e índices auditados.
- Política explícita de concorrência e idempotência.

## Critérios de aceite

- Nenhuma operação composta deixa persistência parcial após falha.
- Implementações atendem ao mesmo contrato e suíte compartilhada.
- Produção nunca utiliza repositório em memória.

## Definition of Done

- [ ] Portas e adapters implementados.
- [ ] Testes contratuais executados para memória e PostgreSQL.
- [ ] Rollback transacional validado.
- [ ] Gates DEV e QA aprovados.
