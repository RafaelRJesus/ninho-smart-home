# ADR 0003 — Transporte inicial de eventos

## Status

Proposto; depende de aprovação da hipótese H3.

## Decisão proposta

Usar SSE para estados e confirmações servidor→cliente na primeira etapa. Manter contrato interno de eventos independente para permitir WebSocket no futuro. MQTT pertence aos adapters de integração.

## Motivo

SSE reduz complexidade inicial, reconecta automaticamente e atende atualizações unidirecionais do dashboard.
