# Sprint 17 — Domínio e aplicação de dispositivos

## Objetivo

Usar dispositivos como primeira fatia vertical da nova arquitetura em camadas.

## Escopo

- Entidades, capacidades e políticas de comando no domínio puro.
- Casos de uso para cadastrar, consultar, atualizar, controlar e remover dispositivos.
- Portas para persistência, provider, auditoria e eventos.
- Idempotência, confirmação crítica, PIN e versionamento otimista no caso de uso.
- Um único fluxo para interface, voz, texto, cenas e automações.

## Critérios de aceite

- Domínio não importa Express, PostgreSQL, variáveis de ambiente ou SDK externo.
- Controllers de dispositivos apenas validam DTO, chamam caso de uso e apresentam resposta.
- Todo comando possui recibo, correlação, auditoria e resultado confirmado.

## Definition of Done

- [ ] Casos de uso e políticas implementados.
- [ ] Fluxos antigos delegam para a nova camada.
- [ ] Testes unitários e integração com provider aprovados.
- [ ] Gates DEV e QA aprovados.
