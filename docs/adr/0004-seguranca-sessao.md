# ADR 0004 — Sessão e autorização

## Status

Proposto.

## Decisão proposta

Sessão com access token curto, refresh rotativo em cookie `HttpOnly`, `Secure` e `SameSite`, autorização RBAC por residência no backend e Argon2id para senha. PIN adicional para ações críticas configuradas.
