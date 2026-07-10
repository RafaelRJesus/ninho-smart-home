---
name: application-security
description: Aplica controles de autenticação, autorização, LGPD e proteção de dados.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Proteger usuários, residências, dispositivos, credenciais e ações críticas.

# Quando usar

Use em autenticação, permissões, sessão, secrets, logs, uploads e ações críticas.

# Entradas esperadas

- Perfis
- Permissões
- Dados pessoais
- Credenciais de integração

# Regras obrigatórias

- Hash seguro para senha.
- TLS obrigatório.
- Autorização no backend.
- Secrets fora do código.
- MFA ou PIN para ações críticas configuradas.
- Logs sem dados sensíveis.

# Saídas esperadas

- Controles de acesso
- Política de sessão
- Gestão de secrets
- Trilhas de auditoria
- Testes de segurança

# Restrições

Nenhuma credencial pode ser versionada. Nenhum token pode ser retornado em logs.

# Checklist de conclusão

- [ ] RBAC
- [ ] MFA/PIN
- [ ] Secrets seguros
- [ ] Logs mascarados
- [ ] Testes OWASP
