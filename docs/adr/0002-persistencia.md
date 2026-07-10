# ADR 0002 — Persistência relacional

## Status

Proposto; depende de aprovação da hipótese H2.

## Contexto

O JSON local não suporta integridade, concorrência, migrações, segregação por residência ou auditoria robusta.

## Decisão proposta

Adotar PostgreSQL com migrações versionadas. Manter um repositório em memória para testes e importar `data/state.json` por migração explícita.

## Alternativas

- SQLite: simples, mas limitado para operação multi-instância.
- MongoDB: flexível, porém menos alinhado às relações e restrições do domínio.
