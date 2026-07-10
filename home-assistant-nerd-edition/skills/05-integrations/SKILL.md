---
name: device-integrations
description: Padroniza integrações com Home Assistant, Tuya/Smart Life e provedores futuros.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Isolar provedores externos e oferecer um contrato interno único para dispositivos.

# Quando usar

Use ao conectar, sincronizar, consultar estado, enviar comandos e assinar eventos.

# Entradas esperadas

- Credenciais
- Região/data center
- IDs externos
- Capacidades dos dispositivos

# Regras obrigatórias

- Implementar adaptador por provedor.
- Usar timeouts, retry controlado e circuit breaker.
- Nunca expor token no frontend.
- Mapear erros externos para erros internos.
- Registrar última sincronização.

# Saídas esperadas

- Adaptadores
- Mapeamento de dispositivos
- Sincronização
- Health check
- Testes de contrato

# Restrições

Não duplicar dispositivos. Não bloquear o sistema quando um provedor estiver indisponível.

# Checklist de conclusão

- [ ] Conexão segura
- [ ] Sincronização
- [ ] Retry
- [ ] Circuit breaker
- [ ] Teste de contrato
