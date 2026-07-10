# Rebaseline do produto Ninho

Referência normativa: `home-assistant-nerd-edition/`.

## Objetivo do produto

Como morador, quero centralizar dispositivos e automações de uma ou mais residências para monitorar e controlar a casa com segurança, contexto visual e rastreabilidade.

## Estado atual

| Capacidade | Estado | Evidência | Lacuna principal |
|---|---|---|---|
| Dashboard web | Parcial | `src/main.jsx` | Componentização, tempo real e testes UI |
| Planta baixa | Parcial | `Plant` em `src/main.jsx` | Zoom, pan, pisos, versões e camadas |
| Cômodos | Parcial | `/api/rooms` | Pisos, residência e autorização |
| Dispositivos | Parcial | `/api/devices` | Domínio persistente, capacidades e auditoria |
| Tuya | Parcial | `server/tuya-client.js` | Adapter, retry, circuit breaker e eventos |
| Home Assistant | Ausente | — | Adapter e eventos |
| Assistente | Parcial | `server/assistant.js` | Autorização e ferramentas de domínio |
| Autenticação/RBAC | Ausente | — | Usuários, sessão e segregação |
| Banco relacional | Ausente | JSON local | Migrações, integridade e backup |
| Tempo real | Ausente | — | SSE/WebSocket/MQTT |
| Cenas/automações | Ausente | — | Domínio e prevenção de loops |
| Energia/notificações | Ausente | — | Persistência, canais e preferências |
| Observabilidade | Inicial | `/api/health` | Logs estruturados, métricas e tracing |
| CI/CD | Ausente | — | Pipeline e gates |

## Hipóteses que exigem decisão

- H1: o produto suportará múltiplas residências e múltiplos usuários.
- H2: PostgreSQL será o banco relacional principal.
- H3: SSE será o primeiro transporte de eventos; MQTT ficará restrito aos adapters.
- H4: Redis será introduzido somente quando cache/fila forem necessários.
- H5: o frontend e o backend migrarão incrementalmente para TypeScript.
- H6: ações críticas serão fechadura, portão, alarme e exclusões destrutivas.

Nenhuma hipótese deve virar regra de produção sem ADR aprovado.

## Riscos imediatos

1. Credenciais reais dependem de `.env` local sem secrets manager.
2. Ausência de autenticação permite acesso irrestrito ao backend.
3. Estado em JSON não oferece concorrência ou integridade referencial.
4. Regras de negócio estão misturadas com rotas e componentes.
5. Falha da Tuya pode degradar todas as consultas de dispositivos.
6. Não há confirmação assíncrona do estado final de comandos.

## Definition of Ready adaptada

Uma história só entra em execução quando possuir objetivo, critérios Dado/Quando/Então, exceções, contrato de API, riscos, dependências e massa de teste.

## Definition of Done adaptada

Código revisado, critérios atendidos, testes unitários/API/UI aprovados, sem vulnerabilidade crítica/alta, logs e documentação atualizados, evidência de QA e rollback aplicável documentado.
