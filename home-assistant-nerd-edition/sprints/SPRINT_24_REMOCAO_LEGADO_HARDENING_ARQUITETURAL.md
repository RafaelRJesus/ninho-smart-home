# Sprint 24 — Remoção do legado e hardening arquitetural

## Objetivo

Eliminar caminhos antigos e tornar as fronteiras da arquitetura verificáveis pela pipeline.

## Escopo

- Remoção de rotas, serviços, repositórios e clientes HTTP substituídos.
- Regras ESLint para impedir imports entre camadas proibidas.
- Auditoria de dependências, arquivos mortos e duplicações.
- Testes completos de regressão, segurança, carga, backup e rollback.
- ADRs, mapa arquitetural, OpenAPI e runbooks finais.

## Critérios de aceite

- Não existem dois caminhos para executar o mesmo caso de uso.
- Domínio permanece independente de frameworks e infraestrutura.
- Frontend usa somente contratos e cliente HTTP oficiais.
- Nenhum defeito crítico ou alto permanece aberto.

## Definition of Done

- [ ] Legado removido com evidência de não utilização.
- [ ] Fronteiras verificadas automaticamente no CI.
- [ ] Regressão, segurança, carga, backup e rollback aprovados.
- [ ] DEV, QA e produção validados.
- [ ] Aprovação arquitetural registrada.
