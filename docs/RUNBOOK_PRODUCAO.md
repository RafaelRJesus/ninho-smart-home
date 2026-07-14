# Runbook de produção e rollback

## Pré-deploy

1. Abra pull request; não faça deploy direto da branch de trabalho.
2. Confirme `npm ci`, `npm run check` e `npm audit --audit-level=high` no CI.
3. Use secrets distintos por ambiente e valide `AUTH_SECRET`, `CORS_ORIGIN`, `METRICS_TOKEN`, TLS e backups.
4. Execute migrações em QA antes da produção e registre a versão da imagem.
5. Execute `npm run release:check` e `docker compose config` antes de subir a imagem.

## Operação

- Liveness: `GET /api/health/live`.
- Readiness: `GET /api/health/ready`; HTTP 503 indica integração degradada.
- Métricas: `GET /api/metrics`, com `Authorization: Bearer <METRICS_TOKEN>` quando configurado.
- SLO inicial: 99,5% de disponibilidade mensal e p95 inferior a 800 ms, excluindo indisponibilidade do provedor.
- Alerta: erro HTTP 5xx acima de 2% por cinco minutos ou readiness indisponível por três verificações.
- Retenha logs de aplicação por 30 dias. Eles não devem conter corpos, cookies, tokens ou secrets.

## Rollback

1. Interrompa novas implantações e registre o incidente/correlationId.
2. Reative a imagem anterior pelo identificador imutável, sem reutilizar a tag `latest`.
3. Para migrações incompatíveis, restaure o snapshot anterior conforme `database/README.md`.
4. Valide liveness, readiness, login, listagem e um comando seguro em QA/produção.
5. Documente causa, impacto e ação preventiva antes de liberar novo deploy.

## Implantação com Compose

1. Defina `NINHO_VERSION` com uma versão imutável e execute `docker compose build`.
2. Execute `docker compose up -d` e aguarde o estado `healthy`.
3. Valide `/api/health/ready` e os fluxos essenciais.
4. Faça backup do PostgreSQL antes de atualizações. O arquivo `.env` nunca deve entrar na imagem.

## TLS e proxy

Em produção, publique a aplicação atrás de proxy TLS, configure `TRUST_PROXY=true` e envie `X-Forwarded-Proto: https`. O acesso HTTP à aplicação retorna 426, exceto health checks locais.
