---
name: backend-domain
description: Define APIs, serviços de domínio, validações e regras da aplicação.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Manter as regras de negócio centralizadas no backend e independentes da interface.

# Quando usar

Use ao implementar APIs, serviços, comandos, usuários, casas, cômodos, dispositivos, cenas e automações.

# Entradas esperadas

- Histórias
- Modelo de dados
- Contratos de integração
- Regras de permissão

# Regras obrigatórias

- Backend é a fonte de verdade.
- Toda entrada deve ser validada.
- Toda ação deve validar autorização.
- Comandos críticos devem ser idempotentes.
- Erros devem usar códigos e mensagens padronizados.

# Saídas esperadas

- Endpoints versionados
- Serviços de domínio
- Validações
- Testes unitários e de API

# Restrições

Não acessar diretamente SDKs externos no domínio. Usar portas e adaptadores.

# Checklist de conclusão

- [ ] Validação
- [ ] Autorização
- [ ] Idempotência
- [ ] Documentação OpenAPI
- [ ] Testes
