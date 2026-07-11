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

Dispositivos demonstrativos, cenas e preferências visuais ainda utilizam o estado local. Faça backup antes de migrations e valide restauração em homologação.
