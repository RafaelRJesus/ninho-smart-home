# ADR 0001 — Evolução incremental em arquitetura modular

## Status

Aceito.

## Contexto

O protótipo já controla dispositivos e possui valor demonstrável, mas concentra frontend, domínio e infraestrutura em poucos arquivos.

## Decisão

Migrar incrementalmente para módulos `web`, `api`, `domain`, `contracts` e `integrations`, preservando rotas existentes por uma janela de compatibilidade. Novas APIs serão publicadas em `/api/v1`.

## Consequências

- O produto permanece utilizável durante a migração.
- Haverá duplicação temporária de adapters/rotas.
- Cada migração exige teste de regressão.
