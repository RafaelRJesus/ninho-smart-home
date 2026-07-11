# Rebaseline do produto Ninho

Referência normativa: `home-assistant-nerd-edition/`.

Data da revisão: 2026-07-10.

## Objetivo do produto

Como morador, quero centralizar dispositivos e automações de uma ou mais residências para monitorar e controlar a casa com segurança, contexto visual e rastreabilidade.

## Fonte de verdade do progresso

O acompanhamento incremental está em `home-assistant-nerd-edition/sprints/CONTROLE_DE_EVOLUCAO.md`. O checklist deve ser atualizado no mesmo commit de cada evolução, evitando reauditorias completas sem mudança de requisito ou regressão.

## Estado atual

| Capacidade | Estado | Evidência | Lacuna principal |
|---|---|---|---|
| Fundação | Concluída | CI, Security Analysis, contratos, tokens e configurações por ambiente | Manter gates e evidências a cada PR |
| Dashboard web | Parcial | `OperationalDashboard.jsx`, SSE e workspace operacional | Completar segurança, internet, câmeras e testes UI |
| Planta baixa | Parcial | `FloorplanEditor.jsx` e `floorplan.js` | Upload, versões, desenho, tela cheia e teste com 200 dispositivos |
| Residências/pisos/cômodos | Parcial avançado | API v1, RBAC e PostgreSQL | Completar CRUD e migrar frontend legado |
| Dispositivos | Parcial avançado | PostgreSQL, API v1 residencial, comandos e adapters | Encerrar rotas legadas após compatibilidade |
| Tuya | Parcial avançado | Adapter, assinatura, capacidades, sync e resiliência | Confirmação assíncrona e eventos persistentes |
| Home Assistant | Parcial avançado | Adapter REST/WebSocket e documentação | Configuração completa na UI e validação real em produção |
| Assistente | Parcial | Comandos locais e OpenAI opcional | Operar apenas sobre serviços residenciais autorizados |
| Autenticação/RBAC | Parcial avançado | Sessão HttpOnly, refresh, RBAC e Turnstile | Recuperação de senha e MFA |
| Banco relacional | Parcial avançado | PostgreSQL para identidade, RBAC, cofre e domínio residencial | Backup/restore e retirada do Store legado |
| Tempo real | Parcial avançado | SSE e EventBus | Confirmação ponta a ponta dos provedores |
| Cenas/automações | Parcial avançado | CRUD, execução, deduplicação e eventos | Gatilhos contínuos, conflitos e PostgreSQL |
| Energia/notificações | Parcial | Workspace, tarifa, leituras e notificações internas | Canais externos, agregações e alertas |
| Segurança/LGPD | Parcial avançado | Hardening, cofre, CAPTCHA, audit e security pipeline | MFA e direitos do titular |
| Observabilidade | Parcial | Logs, correlation ID, métricas e health checks | Tracing, dashboard, alertas e DLQ |
| Qualidade | Parcial avançado | 45 testes, smoke, carga, estresse e pipeline diária | UI/E2E, acessibilidade e volume da planta |
| CI/CD | Parcial avançado | CI, CodeQL, secret scan, QA efêmero e deploy Render | Aprovação de produção e rollback executado |

## Decisões vigentes

- PostgreSQL é o banco relacional principal.
- SSE é o transporte inicial de eventos servidor→cliente; MQTT permanece nos adapters.
- Redis/fila será introduzido quando automações e notificações exigirem processamento persistente.
- A migração para TypeScript permanece incremental.
- Fechadura, portão, alarme e exclusões destrutivas são ações críticas.
- DEV usa configuração local, QA roda isolado no GitHub Actions e PROD roda no Render.

## Riscos atuais

1. Rotas legadas `/api` e o `Store` permanecem temporariamente no backend para compatibilidade, embora o frontend utilize a API v1 residencial.
2. Confirmações de estado do provedor ainda não fecham todo o fluxo assíncrono do comando.
4. Não existem testes UI/E2E nem auditoria WCAG automatizada.
5. Backup/restore e rollback estão documentados, mas ainda não foram executados com evidência.
6. Alertas, tracing e fila de falhas ainda não estão ativos.

## Próxima linha de execução

Concluir a retirada das rotas legadas após validar a migration em QA/produção e seguir para recuperação de senha na Sprint 01.

## Definition of Ready adaptada

Uma história só entra em execução quando possui objetivo, critérios Dado/Quando/Então, exceções, contrato de API, riscos, dependências e massa de teste.

## Definition of Done adaptada

Código revisado, critérios atendidos, testes unitários/API/UI aplicáveis aprovados, sem vulnerabilidade crítica/alta, logs e documentação atualizados, evidência de QA e rollback aplicável documentado.
