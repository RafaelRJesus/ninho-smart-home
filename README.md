# Ninho — assistente residencial Tuya

[![Continuous Integration](https://github.com/RafaelRJesus/ninho-smart-home/actions/workflows/ci.yml/badge.svg)](https://github.com/RafaelRJesus/ninho-smart-home/actions/workflows/ci.yml)

Aplicação web operacional para controlar produtos Tuya/Ekaza por clique, texto e voz. Inclui dashboard React, planta interativa, backend Express, persistência local, interpretação de comandos e integração opcional com OpenAI.

## Requisitos

- Node.js 22 ou superior
- Conta no Tuya Developer Platform para aparelhos físicos
- Chrome ou Edge para reconhecimento de voz no navegador

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Sem credenciais, o sistema inicia em modo demonstração e salva mudanças em `data/state.json`.

## Produção

```bash
npm run check
npm run build
npm start
```

Acesse `http://localhost:3001`. O Express serve o frontend compilado e as APIs no mesmo processo. Verifique a saúde em `GET /api/health`.

Em produção, use um proxy HTTPS, defina `TRUST_PROXY=true` e mantenha `REQUIRE_HTTPS=true`. Os procedimentos de métricas, alertas e rollback estão em [docs/RUNBOOK_PRODUCAO.md](docs/RUNBOOK_PRODUCAO.md).

Com Docker:

```bash
docker build -t ninho-tuya .
docker run --env-file .env -p 3001:3001 -v ninho-data:/app/data ninho-tuya
```

Ou com Docker Compose:

```bash
npm run env:check
docker compose up -d --build
docker compose ps
```

O volume `ninho-data` preserva dispositivos, planta, cenas e preferências após recriar o container. Para homologação completa antes de uma release, execute `npm run release:check`.

### Demo gratuita no Render

O arquivo `render.yaml` publica uma demonstração segura sem credenciais Tuya, Home Assistant ou OpenAI. No Render, escolha **New > Blueprint**, conecte este repositório e confirme o plano Free. O `AUTH_SECRET` e o token de métricas são gerados automaticamente.

O sistema inicia em modo demonstração. Como o filesystem do plano gratuito é efêmero, alterações podem ser restauradas após reinicializações ou novos deploys. Não adicione credenciais residenciais reais ao serviço público.

A demonstração exige cadastro/login e protege as APIs residenciais com cookies `HttpOnly`. O painel **Configurações > Cofre de credenciais** demonstra criptografia AES-256-GCM, RBAC, rotação e revogação. Use apenas valores fictícios no Render gratuito; integrações reais exigem persistência privada.

O Blueprint provisiona PostgreSQL e conecta o serviço por `DATABASE_URL`. Usuários, residências, permissões, auditoria, sessões revogadas e o cofre cifrado usam o banco automaticamente; no desenvolvimento sem essa variável, o sistema mantém os adaptadores locais.

## Conectar Ekaza / Tuya

1. Entre no [Tuya Developer Platform](https://platform.tuya.com/) e crie um projeto em **Cloud > Development**.
2. Selecione o data center da conta. Para contas brasileiras, comece com **Western America Data Center**.
3. Abra **Devices > Link Tuya App Account > Add App Account**.
4. Escaneie o QR Code pelo app Ekaza e confirme o vínculo.
5. Em **Overview > Authorization Key**, copie o Access ID e o Access Secret.
6. Preencha o arquivo `.env`:

```env
PORT=3001
TUYA_ACCESS_ID=seu_access_id
TUYA_ACCESS_SECRET=seu_access_secret
TUYA_REGION=us
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
DATA_FILE=./data/state.json
AUTH_SECRET=gere_um_segredo_de_64_caracteres_hexadecimais
CORS_ORIGIN=http://localhost:5173
HOME_ASSISTANT_URL=
HOME_ASSISTANT_TOKEN=
```

Regiões aceitas: `us`, `eu`, `cn` e `in`. Nunca coloque as chaves no frontend ou no Git.

7. Reinicie o servidor e abra **Configurações > Testar Tuya**. Também é possível testar via terminal:

```bash
curl -X POST http://localhost:3001/api/tuya/test
```

Se o Ekaza não reconhecer o QR Code, o aplicativo pode usar um schema OEM que não autoriza projetos pessoais. Nesse caso, teste o mesmo login no Smart Life ou solicite à Ekaza autorização de API.

## Assistente de IA

Os comandos essenciais funcionam sem serviço externo: ligar/desligar por nome, tipo ou ambiente, desligar tudo, ajustar brilho e temperatura. Para interpretar frases mais livres, preencha `OPENAI_API_KEY`; o backend usa a Responses API e nunca envia a chave ao navegador.

Exemplos:

- `Acenda as luzes da sala`
- `Coloque o ar da sala em 22 graus`
- `Luz do quarto com brilho em 40`
- `Desligue tudo`

## Comandos de manutenção

```bash
npm test       # testes de API, comandos e Tuya
npm run build  # compila o frontend
npm run check  # executa toda a validação
npm run test:stress # teste local de carga concorrente
```

## Pipeline de qualidade

Cada push e pull request executa jobs independentes no GitHub Actions:

- testes unitários de domínio, comandos, cofre, planta e Tuya;
- suítes de API, autenticação, integrações e segurança;
- contratos TypeScript;
- auditoria de dependências em severidade alta;
- build de produção com artifact por sete dias;
- smoke test de health, readiness, autenticação e frontend compilado;
- teste de carga isolado com 40 conexões concorrentes em cada push;
- teste de estresse semanal, ou manual, com 100 conexões concorrentes.

O teste de carga reprova a pipeline se encontrar falhas de rede, respostas 5xx, ausência de respostas bem-sucedidas, latência p99 acima do limite ou falta de recuperação após o pico. Respostas 429 são esperadas na rota protegida e comprovam que o servidor está rejeitando excesso de tráfego de maneira controlada.

O build, o smoke test e o teste de carga só iniciam quando os gates anteriores são aprovados. Execuções antigas da mesma branch são canceladas automaticamente. O workflow `Scheduled Stress Test` também pode ser iniciado na aba **Actions**, informando quantidade de conexões e duração.

Esses testes executam contra um servidor efêmero e isolado no GitHub Actions; eles não geram tráfego contra produção. Os resultados detectam regressões e validam os mecanismos de proteção, mas não substituem planejamento de capacidade com infraestrutura equivalente à produção.

### Relatório diário por e-mail

A pipeline completa também roda diariamente às 08:00 no horário de São Paulo e envia o resultado para `rafael.sri@icloud.com`, inclusive quando algum job falha. Para ativar o envio, cadastre em **GitHub > Settings > Secrets and variables > Actions**:

- `ICLOUD_SMTP_USERNAME`: o endereço completo da conta iCloud usada como remetente;
- `ICLOUD_APP_PASSWORD`: uma senha específica de app criada em `account.apple.com`, nunca a senha normal do Apple ID.

As credenciais ficam armazenadas como GitHub Actions Secrets e não são gravadas no repositório nem exibidas no relatório.

Para testar sem esperar o horário agendado, abra **Actions > Continuous Integration > Run workflow**. Execuções comuns de push e pull request não enviam e-mail, evitando notificações excessivas.

O backend renova tokens Tuya, assina chamadas com HMAC-SHA256, descobre as funções suportadas por cada aparelho, valida entradas e mantém as posições da planta após reinicializações.

## Segurança e observabilidade

- Cabeçalhos CSP/HSTS, limite de requisições e limite de corpo estão ativos.
- Ações críticas podem exigir `CRITICAL_ACTION_PIN_SHA256`.
- Logs HTTP são JSON estruturado, possuem `correlationId` e não incluem corpos ou credenciais.
- `/api/health/live` verifica o processo; `/api/health/ready` verifica integrações; `/api/metrics` expõe latência e taxa de erro.

### Proteção anti-bot

Login e cadastro suportam Cloudflare Turnstile com validação obrigatória no backend. Cadastre um widget para `ninho-smart-home.onrender.com` e configure no Render:

```env
TURNSTILE_SITE_KEY=chave_publica_do_widget
TURNSTILE_SECRET_KEY=chave_secreta_do_widget
TURNSTILE_HOSTNAME=ninho-smart-home.onrender.com
TURNSTILE_REQUIRED=true
```

A site key é enviada ao navegador; a secret key permanece somente no Render. Tokens expiram, são de uso único e são validados junto com hostname e action. Nunca ative `TURNSTILE_REQUIRED` antes de configurar as três variáveis.

### Recuperação de senha

O Ninho envia um link de uso único, válido por 30 minutos. O banco guarda somente o SHA-256 do token e a troca invalida sessões anteriores. Configure no Render:

```env
APP_URL=https://ninho-smart-home.onrender.com
SMTP_HOST=smtp.mail.me.com
SMTP_PORT=587
SMTP_USERNAME=seu_email_icloud
SMTP_PASSWORD=senha_especifica_de_app
SMTP_FROM=seu_email_icloud
```

Use uma senha específica de app da Apple. A resposta da API é sempre igual para endereços existentes e inexistentes, impedindo enumeração de contas.
