# ADR 0002 — Persistência relacional

## Status

Aceito e implementado.

## Contexto

O JSON local não suporta integridade, concorrência, migrações, segregação por residência ou auditoria robusta.

## Decisão

Adotar PostgreSQL com migrações versionadas como persistência durável. Manter repositórios em memória somente para desenvolvimento sem banco e testes isolados. O armazenamento JSON legado foi descontinuado após a consolidação do domínio residencial.

## Alternativas

- SQLite: simples, mas limitado para operação multi-instância.
- MongoDB: flexível, porém menos alinhado às relações e restrições do domínio.
