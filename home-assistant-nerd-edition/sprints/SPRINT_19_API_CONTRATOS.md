# Sprint 19 — API e contratos

## Objetivo

Transformar a API em uma fronteira fina, validada e sincronizada com consumidores.

## Escopo

- Routers e controllers separados por módulo.
- Schemas compartilhados de entrada, saída e erro.
- Resposta de erro padrão com `code`, `message`, `details` e `correlationId`.
- OpenAPI validado automaticamente no CI.
- Tipos do frontend gerados a partir do contrato público.
- Chaves de idempotência para comandos e execuções.

## Critérios de aceite

- Nenhum controller contém regra de negócio ou SQL.
- Mudança incompatível no contrato falha na pipeline.
- Toda rota possui autenticação, política de autorização e schema explícitos.

## Definition of Done

- [ ] Controllers modulares implementados.
- [ ] OpenAPI e tipos gerados sem divergência.
- [ ] Testes de contrato positivos e negativos aprovados.
- [ ] Gates DEV e QA aprovados.

