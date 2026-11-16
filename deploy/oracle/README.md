# Ninho no Oracle Cloud (Always Free)

Runbook para tirar o Ninho do "só GitHub" e deixá-lo no ar numa VM gratuita do Oracle Cloud, com Postgres próprio (sem banco que expira, que era o problema do Render), HTTPS e deploy automático.

Etapas marcadas **[RAFAEL]** precisam de alguém no navegador. As marcadas **[AGENTE]** um agente (Claude no desktop) executa pelo terminal/SSH.

## Arquitetura

```
Internet ──► :80/:443  caddy (HTTPS automático)
                           │
                           ▼
                     ninho:3001  (Express + React compilado)
                           │  rede interna do Compose
                           ▼
                     db:5432  postgres:16 (volume pgdata, sem porta pública)
```

- VM: Ubuntu 24.04 **aarch64**, shape `VM.Standard.A1.Flex`, com o máximo Always Free que o console mostrar (em 2026 caiu para 2 OCPUs / 12 GB).
- Arquivos desta pasta:

| Arquivo | Para quê |
|---|---|
| `docker-compose.yml` | Sobe `db`, `ninho` e `caddy` |
| `Caddyfile` | Proxy reverso com certificado automático |
| `.env.oracle.example` | Modelo do `.env` (só valores fictícios) |
| `setup-vm.sh` | Prepara a VM (Docker, iptables, swap, SSH) |
| `backup.sh` | `pg_dump` diário, mantém 7 |
| `../../.github/workflows/deploy-oracle.yml` | Deploy automático após o CI passar na `main` |

## Regras

- Só criar recursos com o selo **Always Free**. Nada pago.
- Nunca commitar `.env`, chaves ou senhas.
- Commits pequenos, cada um explicando o que foi feito.
- Integrações: Tuya/Ekaza é nuvem, então funciona daqui. Home Assistant local **não** é alcançável a partir da Oracle (fica na rede de casa).

## 1. Conta [RAFAEL]

1. Criar conta em <https://www.oracle.com/cloud/free/>. O cartão é só para verificação.
2. **Home region:** escolher `Brazil East (São Paulo)` ou `Brazil Southeast (Vinhedo)`. Não dá para trocar depois, e as VMs Always Free só podem ser criadas nela.

## 2. Chave SSH [AGENTE]

```bash
ssh-keygen -t ed25519 -f ~/.ssh/oracle_ninho -C "ninho-oracle" -N ""
cat ~/.ssh/oracle_ninho.pub   # mostrar para o Rafael colar no console
```

## 3. VM [RAFAEL]

Console → **Compute → Instances → Create instance**:

- Image: **Canonical Ubuntu 24.04** (aarch64)
- Shape: **Ampere → VM.Standard.A1.Flex**, OCPUs e memória no máximo Always Free
- Networking: criar VCN nova, subnet pública, **atribuir IPv4 público**
- SSH keys: colar a chave pública da etapa 2
- Boot volume: padrão (~47–50 GB, dentro dos 200 GB grátis)

Se der **"Out of capacity"**: trocar o Availability Domain ou tentar em outro horário (é comum na ARM gratuita).

Anotar o **IP público** e passar para o agente.

## 4. Abrir 80 e 443 na rede da Oracle [RAFAEL]

**Networking → Virtual Cloud Networks → (VCN) → Security Lists → Default → Add Ingress Rules**:

- Source `0.0.0.0/0`, TCP, destination port `80`
- Source `0.0.0.0/0`, TCP, destination port `443`

(A 22 já vem aberta.)

## 5. Preparar a VM [AGENTE]

```bash
ssh -i ~/.ssh/oracle_ninho ubuntu@IP_PUBLICO
git clone https://github.com/RafaelRJesus/ninho-smart-home.git /tmp/ninho
sudo bash /tmp/ninho/deploy/oracle/setup-vm.sh
exit   # reconectar para o grupo docker valer
```

Depois:

```bash
ssh -i ~/.ssh/oracle_ninho ubuntu@IP_PUBLICO
git clone https://github.com/RafaelRJesus/ninho-smart-home.git /opt/ninho
```

## 6. Configurar o `.env` [AGENTE]

```bash
cd /opt/ninho/deploy/oracle
cp .env.oracle.example .env
chmod 600 .env
```

Preencher:

- `DOMAIN`, `APP_URL`, `CORS_ORIGIN`: sem domínio próprio, usar o IP com traços + `.sslip.io` (IP `150.1.2.3` → `150-1-2-3.sslip.io`). `APP_URL` e `CORS_ORIGIN` com `https://` na frente.
- `POSTGRES_PASSWORD`, `INTEGRATION_MASTER_KEY`, `METRICS_TOKEN`: `openssl rand -hex 32` cada.
- `AUTH_SECRET`: `openssl rand -hex 32` (64 caracteres).
- **Mostrar ao Rafael** `INTEGRATION_MASTER_KEY` e `POSTGRES_PASSWORD` para ele guardar num gerenciador de senhas. Sem a master key, as credenciais cifradas no cofre não podem ser recuperadas.
- Tuya/SMTP/OpenAI: opcionais. Sem Tuya, o app sobe em modo demonstração.

Validar:

```bash
docker run --rm --env-file .env -v /opt/ninho:/app -w /app node:22-alpine \
  sh -c "npm ci --ignore-scripts --omit=dev >/dev/null && node scripts/validate-production-env.js"
```

## 7. Primeiro deploy [AGENTE]

```bash
cd /opt/ninho/deploy/oracle
docker compose up -d --build
docker compose ps
docker compose logs -f ninho   # ver as migrations rodando no startup
curl -fsS https://DOMINIO/api/health/live
```

O Caddy pode levar alguns segundos para emitir o certificado na primeira subida.

## 8. Backup diário [AGENTE]

```bash
(crontab -l 2>/dev/null; echo '15 3 * * * /opt/ninho/deploy/oracle/backup.sh >> /opt/backups/backup.log 2>&1') | crontab -
/opt/ninho/deploy/oracle/backup.sh   # testar uma vez
```

## 9. Deploy automático [RAFAEL + AGENTE]

O agente gera uma chave só para o GitHub Actions e autoriza na VM:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ninho_actions -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/ninho_actions.pub -f -o "IdentityFile ~/.ssh/oracle_ninho" ubuntu@IP_PUBLICO
ssh-keyscan -t ed25519 IP_PUBLICO   # saída vai para ORACLE_KNOWN_HOSTS
```

**[RAFAEL]** No GitHub → repo → **Settings → Environments → production**:

| Tipo | Nome | Valor |
|---|---|---|
| Secret | `ORACLE_HOST` | IP público |
| Secret | `ORACLE_USER` | `ubuntu` |
| Secret | `ORACLE_SSH_KEY` | conteúdo de `~/.ssh/ninho_actions` (privada) |
| Secret | `ORACLE_KNOWN_HOSTS` | saída do `ssh-keyscan` |
| Variable | `ORACLE_APP_URL` | `https://DOMINIO` |

Testar: **Actions → Deploy Oracle Cloud → Run workflow**. Depois disso, todo push na `main` que passar no CI vai para a VM sozinho.

## 10. Desligar o Render de vez

Quando o Ninho estiver no ar na Oracle, `render.yaml` e as URLs `onrender.com` em `.env.production.example` podem ser removidos num commit próprio.

## Cuidados

- **VM ociosa:** a Oracle pode recolher uma VM Always Free se, numa janela de 7 dias, CPU (percentil 95), rede e memória ficarem todas abaixo de 20%. O Ninho sozinho usa pouco, então há risco real. A saída recomendada é converter a conta para **Pay As You Go**: os recursos Always Free continuam gratuitos e a VM deixa de ser recolhida. Não usar scripts de "carga falsa".
- **Disco:** `docker image prune -f` roda a cada deploy; se encher, `docker system prune`.
- **Monitorar:** `docker compose ps`, `docker compose logs -f ninho`, `GET /api/health/ready`.

## Checklist

- [ ] VM com selo Always Free, na home region
- [ ] 80/443 abertas na Security List **e** no iptables (`setup-vm.sh`)
- [ ] Postgres sem porta pública
- [ ] HTTPS ok e `/api/health/live` respondendo
- [ ] `INTEGRATION_MASTER_KEY` e senha do banco guardadas pelo Rafael
- [ ] Backup diário rodando
- [ ] Deploy automático testado com um commit
- [ ] Conta convertida para Pay As You Go (opcional, evita recolhimento)
