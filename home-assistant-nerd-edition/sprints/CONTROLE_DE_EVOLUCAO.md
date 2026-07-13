# Controle de evolução dos sprints

Este arquivo é a fonte de verdade do progresso do roadmap. Atualize o checklist no mesmo commit que entrega a evolução e registre a evidência verificável. Não marque um sprint como concluído quando houver item obrigatório pendente.

## Convenções

- `[x]` concluído e com evidência no repositório ou na pipeline.
- `[ ]` pendente.
- **Parcial**: há entrega utilizável, mas falta ao menos um critério obrigatório.
- **Concluído**: escopo e critérios obrigatórios atendidos, testes aprovados e evidências registradas.

## Resumo

| Sprint | Tema | Estado | Última revisão |
|---|---|---|---|
| 00 | Fundação | **Concluído** | 2026-07-10 |
| 01 | Identidade e layout | **Concluído** | 2026-07-11 |
| 02 | Estrutura da casa | **Concluído** | 2026-07-11 |
| 03 | Integrações | **Concluído** | 2026-07-11 |
| 04 | Dashboard | **Concluído** | 2026-07-13 |
| 05 | Planta visual | **Concluído** | 2026-07-13 |
| 06 | Dispositivos na planta | Parcial | 2026-07-10 |
| 07 | Controles avançados | Parcial | 2026-07-10 |
| 08 | Edição e camadas | Parcial | 2026-07-10 |
| 09 | Cenas e automações | Parcial avançado | 2026-07-10 |
| 10 | Notificações e energia | Parcial | 2026-07-10 |
| 11 | Segurança e LGPD | Parcial avançado | 2026-07-10 |
| 12 | Resiliência e observabilidade | Parcial | 2026-07-10 |
| 13 | Performance e acessibilidade | Parcial | 2026-07-10 |
| 14 | Hardening e release | Parcial | 2026-07-10 |

## Sprint 00 — Fundação e preparação

- [x] Stack e arquitetura definidas.
- [x] Repositório Git e convenção de commits configurados.
- [x] Ambientes segregados: DEV local, QA efêmero no GitHub Actions e PROD no Render.
- [x] CI executada em push e pull request.
- [x] Lint, testes, auditoria de dependências, secret scan e CodeQL configurados.
- [x] Design tokens criados em `src/design-system/tokens.css`.
- [x] Contratos iniciais em `packages/contracts` e `docs/openapi.yaml`.
- [x] Secrets fora do repositório e injetados por ambiente.
- [x] Arquitetura e decisões documentadas em `docs/adr`.
- [x] Smoke de produção executado no ambiente QA da pipeline.

Evidências: `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `.env.*.example`, `docs/adr/`, `src/design-system/tokens.css`, `packages/contracts/`, `docs/openapi.yaml`.

## Sprint 01 — Identidade, autenticação e layout

- [x] Cadastro, login, logout e renovação segura de sessão.
- [x] Recuperação com token de uso único, expiração, resposta antienumeração e invalidação de sessões.
- [x] RBAC inicial por residência.
- [x] Shell, menu lateral e responsividade base.
- [x] Proteção anti-bot na autenticação.
- [x] Testes automatizados de interface e E2E em desktop e mobile configurados no QA.
- [x] Gate QA aprovado no PR #4: unitários, integração, PostgreSQL, E2E desktop/mobile, build, smoke, carga, segredos e CodeQL.

## Sprint 02 — Estrutura da residência

- [x] Criação e listagem de residências, pisos e cômodos no PostgreSQL.
- [x] Segregação e auditoria por residência.
- [x] Atualização e exclusão versionadas de residência, pisos e cômodos.
- [x] Persistência PostgreSQL de dispositivos, estados, planta, cenas, automações, notificações e energia.
- [x] Repositórios equivalentes para PostgreSQL e testes em memória.
- [x] Frontend consumindo a API residencial versionada para o domínio da casa.
- [x] Testes de segregação entre residências e integração PostgreSQL em QA.
- [x] Remoção definitiva das rotas e do `Store` legados após a janela de compatibilidade.
- [x] Identificador externo único por residência, associação dispositivo-cômodo e status online/offline persistidos.
- [x] RBAC administrativo, auditoria e conflitos de versão cobertos por testes positivos e negativos.
- [x] Gate DEV e QA aprovados no PR #5: unitários, integração, PostgreSQL, E2E, build, smoke, carga, segredos e CodeQL.

## Sprint 03 — Home Assistant e Tuya

- [x] Contrato comum e adaptadores por provedor.
- [x] Tuya e Home Assistant implementados.
- [x] Sincronização sem duplicidade, health check, timeout, retry e circuit breaker.
- [x] Cofre criptografado de credenciais.
- [x] Eventos externos persistindo estados no domínio residencial e publicados por SSE.
- [x] Fluxo completo de configuração, teste e sincronização de Tuya e Home Assistant na interface.
- [x] Credenciais do cofre consumidas por provedores isolados por residência.
- [x] Proteção SSRF, RBAC administrativo, auditoria e `lastSyncAt` implementados.
- [x] Gate DEV e QA aprovados no PR #6: unitários, integração, PostgreSQL, E2E, build, smoke, carga, segredos e CodeQL.

## Sprint 04 — Dashboard operacional

- [x] Visão operacional, dispositivos, clima, energia e atividade.
- [x] Atualização por SSE sem recarregar a página.
- [x] Cards completos de segurança, internet e câmeras.
- [x] Teste automatizado do carregamento inicial em até três segundos em desktop e mobile.
- [x] Estados loading, vazio, erro e offline em todos os blocos.
- [x] Snapshot agregado no backend, protegido por autenticação e RBAC residencial.
- [x] Luzes, gráfico de energia, automações recentes, auditoria e informações do sistema no cockpit.
- [x] Gate DEV e QA aprovados no PR #7: unitários, integração, PostgreSQL, E2E, build, smoke, carga, segredos e CodeQL.

## Sprint 05 — Planta baixa: visualização

- [x] Planta por ambientes com zoom, pan, centralização e seleção.
- [x] Limites de zoom e persistência de posição durante a sessão.
- [x] Upload seguro de planta PNG, JPEG, WebP ou SVG, isolado por piso.
- [x] Validação de tamanho e conteúdo, RBAC administrativo e auditoria do upload.
- [x] Tela cheia com entrada e saída acessíveis.
- [x] Gestos mobile automatizados e seleção por piso.
- [x] Estados de carregamento, vazio e erro no visualizador.
- [x] Gate DEV e QA aprovados no PR #8: unitários, integração, PostgreSQL, E2E desktop/mobile, build, smoke, carga, segredos e CodeQL.

## Sprint 06 — Planta baixa: dispositivos

- [x] Posicionamento, ícones, seleção e painel contextual.
- [x] Estados ligado, desligado e offline.
- [ ] Estado visual de erro dedicado.
- [ ] Confirmação assíncrona do estado final pelo backend.
- [ ] Restauração visual automática quando o comando falhar.

## Sprint 07 — Controles avançados

- [x] Energia, brilho e temperatura conforme capacidade.
- [x] PIN disponível para ações críticas.
- [ ] Cor de iluminação e controles completos de mídia.
- [ ] Câmeras, fechaduras e portões com permissões específicas.
- [ ] Confirmação visual obrigatória de ações críticas.

## Sprint 08 — Edição da planta e camadas

- [x] Modo de edição, reposicionamento e camadas iniciais.
- [x] Comandos bloqueados durante a edição.
- [ ] Desenho e ajuste geométrico dos cômodos.
- [ ] Versionamento e restauração da planta.
- [ ] Alerta de alterações não salvas.

## Sprint 09 — Cenas e automações

- [x] CRUD e execução de cenas.
- [x] CRUD, ativação e teste manual de automações.
- [x] Resultado total/parcial e deduplicação de execução.
- [ ] Motor contínuo de gatilhos e condições.
- [ ] Detecção e alerta de conflitos/loops entre automações.
- [ ] Persistência PostgreSQL por residência.

## Sprint 10 — Notificações e energia

- [x] Central interna de notificações, severidade e leitura.
- [x] Leituras de energia, ausência diferente de zero e tarifa configurável.
- [ ] Preferências de canal, push/e-mail e horário silencioso.
- [ ] Agregações diária, mensal, por cômodo e dispositivo.
- [ ] Alertas configuráveis de consumo.

## Sprint 11 — Segurança e LGPD

- [x] Sessão curta, refresh rotativo, RBAC, rate limit e hardening HTTP.
- [x] CAPTCHA, criptografia de credenciais e logs mascarados.
- [x] Auditoria de dependências, CodeQL e secret scan.
- [ ] MFA opcional.
- [ ] Consentimento, exportação e exclusão rastreável de dados.
- [ ] Procedimento automatizado de rotação de secrets.

## Sprint 12 — Resiliência e observabilidade

- [x] Logs estruturados, correlation ID, métricas e health checks.
- [x] Timeout, retry, circuit breaker e degradação controlada.
- [ ] Tracing ponta a ponta.
- [ ] Dashboard e alertas operacionais externos.
- [ ] Fila persistente, dead-letter queue e monitoramento.

## Sprint 13 — Performance e acessibilidade

- [x] Teste automatizado de carga, latência p99 e recuperação.
- [x] Navegação básica por teclado, foco e rótulos em controles principais.
- [ ] Teste da planta com 200 ou mais dispositivos.
- [ ] Virtualização, lazy loading e cache onde medidos como necessários.
- [ ] Auditoria WCAG, leitor de tela e testes mobile automatizados.

## Sprint 14 — Hardening e release

- [x] Regressão automatizada, smoke, carga e relatório diário.
- [x] Runbook de produção e rollback documentado.
- [ ] Backup e restauração executados com evidência.
- [ ] Rollback executado em QA com versão imutável.
- [ ] Monitoramento e alertas ativos.
- [ ] Aprovação formal de produto, tecnologia e QA.

## Regra para as próximas entregas

Cada evolução deve atualizar este arquivo, acrescentar ou ajustar testes e apontar a evidência no commit/PR. Uma sprint concluída não precisa ser reavaliada integralmente, salvo regressão, mudança de requisito ou incidente relacionado.
