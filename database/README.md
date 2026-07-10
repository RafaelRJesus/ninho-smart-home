# Banco de dados

As migrações SQL são a fonte versionada do esquema PostgreSQL proposto no ADR 0002. Ainda não são executadas pelo runtime: a adoção depende da aprovação de H2 e da configuração de ambientes. O adapter JSON permanece ativo até uma migração explícita e testada.

Regras:

- Nunca editar uma migração já aplicada.
- Criar uma nova migração para cada mudança.
- Testar `up`, backup e restauração em QA.
- Credenciais do banco ficam fora do repositório.
