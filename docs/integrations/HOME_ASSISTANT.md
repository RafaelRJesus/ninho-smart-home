# Integração Home Assistant

## Configuração

1. Abra o perfil no Home Assistant.
2. Crie um Long-Lived Access Token.
3. No Ninho, abra **Configurações → Integrações e cofre → Home Assistant**.
4. Informe a URL e o token, salve, teste a conexão e clique em **Sincronizar**.
5. O token é enviado uma única vez ao backend, cifrado em AES-256-GCM e nunca pode ser consultado pela interface.

Na versão hospedada, use uma URL HTTPS pública protegida. Endereços `localhost`, domínios `.local` e IPs literais são recusados para impedir SSRF e não são alcançáveis pelo Render.

O adapter usa `GET /api/states`, `POST /api/services/<domain>/<service>` e `/api/websocket` com `subscribe_events` para `state_changed`, conforme a documentação oficial.

Depois da sincronização, cada entidade é identificada por `entity_id`. Novas sincronizações atualizam o mesmo dispositivo, e eventos `state_changed` persistem disponibilidade e estado no domínio da residência antes de publicar SSE para o painel.

## Degradação

As chamadas usam timeout, retry exponencial e circuit breaker. Uma falha do Home Assistant não impede o funcionamento da Tuya ou do modo local.
