# Arquitetura de referência

## Componentes

1. Frontend Web/PWA
2. Backend API
3. Serviço de autenticação
4. Módulo de domínio
5. Banco relacional
6. Cache
7. Broker/fila
8. Gateway de integrações
9. Serviço de notificações
10. Observabilidade

## Fluxo de comando

1. Usuário seleciona um dispositivo.
2. Frontend envia comando com `requestId`.
3. API autentica e autoriza.
4. Domínio valida capacidade e regra.
5. Comando é persistido como pendente.
6. Adaptador envia ao provedor.
7. Evento de confirmação atualiza o estado.
8. WebSocket/SSE notifica o frontend.
9. Auditoria registra o resultado.

## Contrato comum de integração

```text
connect()
disconnect()
listDevices()
getDeviceState()
sendCommand()
subscribeToEvents()
refreshCredentials()
healthCheck()
```

## Regras

- O domínio não conhece SDKs externos.
- O frontend nunca recebe credenciais de provedor.
- Todo comando é idempotente.
- Todo evento possui correlationId.
- Falha externa não derruba o restante da aplicação.
