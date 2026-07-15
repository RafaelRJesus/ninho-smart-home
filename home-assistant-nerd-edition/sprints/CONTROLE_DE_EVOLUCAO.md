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
| 06 | Dispositivos na planta | **Concluído** | 2026-07-13 |
| 07 | Controles avançados | **Concluído** | 2026-07-13 |
| 08 | Edição e camadas | **Concluído** | 2026-07-13 |
| 09 | Cenas e automações | **Concluído** | 2026-07-13 |
| 10 | Notificações e energia | Parcial avançado | 2026-07-15 |
| 11 | Segurança e LGPD | Parcial avançado | 2026-07-10 |
| 12 | Resiliência e observabilidade | Parcial | 2026-07-10 |
| 13 | Performance e acessibilidade | Parcial | 2026-07-10 |
| 14 | Hardening e release | Parcial | 2026-07-10 |
| 15 | Fundação de segurança | Planejado | — |
| 16 | Bootstrap e composição | Planejado | — |
| 17 | Domínio e aplicação de dispositivos | Planejado | — |
| 18 | Persistência modular | Planejado | — |
| 19 | API e contratos | Planejado | — |
| 20 | Fundação do frontend | Planejado | — |
| 21 | Residência e planta em camadas | Planejado | — |
| 22 | Orquestração e integrações | Planejado | — |
| 23 | Energia, notificações e observabilidade | Planejado | — |
| 24 | Remoção do legado e hardening arquitetural | Planejado | — |

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
- [x] Estado visual de erro dedicado, acessível por texto, ícone e forma.
- [x] Confirmação assíncrona do estado final pelo backend e provedor.
- [x] Restauração visual automática quando o comando falhar, com nova tentativa.
- [x] Bloqueio de comandos para dispositivos offline ou em erro sem mutação persistida.
- [x] Persistência dos estados online, offline e erro no PostgreSQL.
- [x] Gate DEV e QA aprovados no PR #9: unitários, integração, PostgreSQL, E2E desktop/mobile, build, smoke, carga, segredos e CodeQL.

## Sprint 07 — Controles avançados

- [x] Energia, brilho e temperatura conforme capacidade.
- [x] PIN disponível para ações críticas.
- [x] Cor de iluminação e controles completos de mídia.
- [x] Câmeras, fechaduras e portões protegidos por RBAC administrativo.
- [x] Confirmação visual e PIN obrigatórios para ações críticas.
- [x] Capacidades normalizadas nos adaptadores Home Assistant e Tuya.
- [x] Valores inválidos e capacidades ausentes rejeitados sem mutação persistida.
- [x] Estados avançados persistidos em memória e PostgreSQL.
- [x] Auditoria crítica sem armazenamento ou exposição do PIN.
- [x] Gate DEV e QA aprovados no PR #10: unitários, integração, PostgreSQL, E2E desktop/mobile, build, smoke, carga, segredos e CodeQL.

## Sprint 08 — Edição da planta e camadas

- [x] Modo de edição, reposicionamento e camadas iniciais.
- [x] Comandos bloqueados durante a edição.
- [x] Desenho e ajuste geométrico dos cômodos.
- [x] Versionamento e restauração da planta em memória e PostgreSQL.
- [x] Alerta de alterações não salvas ao trocar de piso, tela ou fechar o navegador.
- [x] Camadas de temperatura, energia, câmeras e segurança ativáveis individualmente.
- [x] Controle otimista de concorrência, RBAC administrativo e auditoria de restauração.
- [x] Gate DEV e QA aprovados no PR #11: unitários, integração, PostgreSQL, E2E desktop/mobile, build, smoke, carga, segredos e CodeQL.

## Sprint 09 — Cenas e automações

- [x] CRUD e execução de cenas.
- [x] CRUD, ativação e teste manual de automações.
- [x] Resultado total/parcial e deduplicação de execução.
- [x] Motor contínuo de gatilhos manuais, por dispositivo e por horário, com condições.
- [x] Detecção e alerta de conflitos, ciclos diretos e indiretos entre automações.
- [x] Persistência PostgreSQL por residência das regras, alertas e execuções idempotentes.
- [x] Gate DEV e QA aprovados no PR #12: unitários, integração, PostgreSQL, E2E desktop/mobile, build, smoke, carga, segredos e CodeQL.
- [x] Regressão em `main` aprovada e deploy `fbf4914` validado como Live no Render em 2026-07-13.
- [x] Release `0.9.0`, ambiente e commit curto identificáveis na interface e em `/api/version` (PR #13).

## Sprint 10 — Notificações e energia

- [x] Central interna de notificações, severidade e leitura.
- [x] Leituras de energia, ausência diferente de zero e tarifa configurável.
- [x] Preferências de canal interno, push no navegador e e-mail SMTP, com horário silencioso aplicado aos canais externos.
- [x] Agregações diária, mensal, por cômodo e dispositivo, preservando ausência como valor desconhecido.
- [x] Alertas configuráveis de consumo por período, cômodo ou dispositivo, com severidade e geração de notificação.
- [x] Persistência equivalente em memória e PostgreSQL pela migração `0007_notifications_energy.sql`.
- [x] Testes unitários e de API, lint, typecheck e build aprovados localmente em 2026-07-15.
- [ ] Gate QA, deploy e aprovação formal registrados.

Evidências: `server/domain/energy.js`, `server/routes/home-domain.js`, `database/migrations/0007_notifications_energy.sql`, `src/components/AutomationCenter.jsx`, `tests/energy.test.js`, `tests/home-domain-api.test.js`.

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

## Sprint 15 — Fundação de segurança

- [ ] Matriz RBAC centralizada por recurso e ação.
- [ ] CSRF, validação de origem e CORS por allowlist.
- [ ] Assistente submetido ao fluxo seguro de comandos.
- [ ] Produção fail-closed e auditoria sensível completa.
- [ ] Testes negativos por papel e gates DEV/QA aprovados.

## Sprint 16 — Bootstrap e composição

- [ ] Configuração tipada e validada por ambiente.
- [ ] Container de dependências separado.
- [ ] Aplicação HTTP sem efeitos colaterais de importação.
- [ ] Servidor, workers e shutdown desacoplados e testados.

## Sprint 17 — Domínio e aplicação de dispositivos

- [ ] Domínio puro de dispositivos e capacidades.
- [ ] Casos de uso e portas para todos os comandos.
- [ ] Idempotência, criticidade, auditoria e confirmação unificadas.
- [ ] Interface, voz, texto e automações usando o mesmo fluxo.

## Sprint 18 — Persistência modular

- [ ] Repositórios separados por agregado.
- [ ] Implementações equivalentes em memória e PostgreSQL.
- [ ] Unidade de trabalho e rollback transacional.
- [ ] Produção impedida de usar persistência em memória.

## Sprint 19 — API e contratos

- [ ] Controllers finos e modulares.
- [ ] Schemas de entrada, saída e erro.
- [ ] OpenAPI e tipos do frontend sincronizados pelo CI.
- [ ] Contratos e idempotência cobertos por testes.

## Sprint 20 — Fundação do frontend

- [ ] Estrutura por features e dependências compartilhadas.
- [ ] Cliente HTTP único com CSRF e refresh coordenado.
- [ ] Providers de sessão, residência e notificações.
- [ ] Chamadas `fetch` removidas dos componentes visuais migrados.

## Sprint 21 — Residência e planta em camadas

- [ ] Casas, pisos e cômodos migrados para casos de uso.
- [ ] Planta, upload, histórico e concorrência migrados.
- [ ] Features React residenciais e da planta modularizadas.
- [ ] Segregação e E2E desktop/mobile aprovados.

## Sprint 22 — Orquestração e integrações

- [ ] Cenas e automações desacopladas do HTTP.
- [ ] Providers externos implementando portas comuns.
- [ ] Cofre acessível somente no backend autorizado.
- [ ] Scheduler, outbox, retry e idempotência validados.

## Sprint 23 — Energia, notificações e observabilidade

- [ ] Energia e notificações migradas para casos de uso.
- [ ] Logs, métricas e tracing ponta a ponta.
- [ ] Alertas operacionais e runbooks configurados.
- [ ] Privacidade e segregação da telemetria testadas.

## Sprint 24 — Remoção do legado e hardening arquitetural

- [ ] Caminhos antigos removidos após comprovação de não utilização.
- [ ] Imports proibidos bloqueados pelo CI.
- [ ] Regressão, segurança, carga, backup e rollback aprovados.
- [ ] Arquitetura, contratos e runbooks atualizados.
- [ ] DEV, QA e produção aprovados.

## Regra para as próximas entregas

Cada evolução deve atualizar este arquivo, acrescentar ou ajustar testes e apontar a evidência no commit/PR. Uma sprint concluída não precisa ser reavaliada integralmente, salvo regressão, mudança de requisito ou incidente relacionado.
