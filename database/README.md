# Banco de dados

As migrações SQL são a fonte versionada do esquema PostgreSQL proposto no ADR 0002. Quando `DATABASE_URL` está configurada, o servidor executa migrations pendentes no startup e usa PostgreSQL para usuários, residências, RBAC, pisos, cômodos, auditoria, sessões revogadas e credenciais cifradas. Sem a variável, desenvolvimento e testes usam os adaptadores locais.

Regras:

- Nunca editar uma migração já aplicada.
- Criar uma nova migração para cada mudança.
- Testar `up`, backup e restauração em QA.
- Credenciais do banco ficam fora do repositório.
- Nunca armazenar `INTEGRATION_MASTER_KEY` no próprio PostgreSQL.
- Preservar a versão antiga da chave enquanto houver registros cifrados com ela.

Configuração:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/ninho
DATABASE_SSL=true
DATABASE_POOL_SIZE=5
```

A migração `0002_home_domain.sql` persiste dispositivos, estados, planta, cenas, automações, notificações e energia por residência. O `Store` em arquivo permanece somente durante a janela de compatibilidade das rotas legadas e não é fonte de verdade para a API v1.
