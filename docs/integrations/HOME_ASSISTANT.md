# Integração Home Assistant

## Configuração

1. Abra o perfil no Home Assistant.
2. Crie um Long-Lived Access Token.
3. Configure `HOME_ASSISTANT_URL` e `HOME_ASSISTANT_TOKEN` no secrets manager ou `.env` local.
4. Nunca envie o token ao frontend ou aos logs.

O adapter usa `GET /api/states`, `POST /api/services/<domain>/<service>` e `/api/websocket` com `subscribe_events` para `state_changed`, conforme a documentação oficial.

## Degradação

As chamadas usam timeout, retry exponencial e circuit breaker. Uma falha do Home Assistant não impede o funcionamento da Tuya ou do modo local.
