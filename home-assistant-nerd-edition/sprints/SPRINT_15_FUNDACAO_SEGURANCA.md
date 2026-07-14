# Sprint 15 — Fundação de segurança

## Objetivo

Centralizar autenticação e autorização e fechar os riscos prioritários antes da reorganização estrutural.

## Escopo

- Matriz única de permissões por papel, recurso e ação.
- Proteção CSRF e validação de `Origin` em mutações autenticadas por cookie.
- CORS com allowlist por ambiente.
- Permissões explícitas para energia, notificações, assistente e comandos críticos.
- Produção fail-closed para banco, secrets, cofre, métricas e CAPTCHA obrigatórios.
- Auditoria de sucesso e falha para operações sensíveis.

## Critérios de aceite

- Nenhuma escrita é autorizada apenas pelo vínculo genérico com a residência.
- O assistente usa o mesmo fluxo seguro de comando dos controles gráficos.
- Requisições CSRF, origem não autorizada e papéis insuficientes são rejeitados sem mutação.
- A aplicação de produção não inicia com dependência crítica ausente.

## Definition of Done

- [ ] Matriz RBAC implementada e documentada.
- [ ] CSRF, CORS e validação de origem cobertos por testes.
- [ ] Testes negativos para `guest`, `resident`, `admin` e `owner` aprovados.
- [ ] Secret scan, auditoria de dependências e CodeQL aprovados.
- [ ] Gates DEV e QA aprovados.

