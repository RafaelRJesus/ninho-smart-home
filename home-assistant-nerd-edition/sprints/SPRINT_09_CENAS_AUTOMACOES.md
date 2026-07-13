# Sprint 09 — Cenas e automações

## Objetivo

Entregar um motor residencial contínuo, seguro e rastreável para agrupar ações em cenas e executá-las manualmente, por mudança de dispositivo ou por horário.

## Histórias de usuário

- Como morador, quero executar vários dispositivos em uma cena para preparar a casa com uma única ação.
- Como administrador, quero criar automações por estado ou horário para reduzir tarefas repetitivas.
- Como morador, quero saber se a execução foi total, parcial ou falhou para não presumir que a casa respondeu.
- Como administrador, quero ser alertado sobre regras conflitantes e impedir ciclos para manter a casa previsível.

## Escopo entregue

- [x] CRUD administrativo e execução de cenas com validação de capacidades.
- [x] CRUD, ativação e teste manual de automações.
- [x] Gatilhos manuais, por mudança de dispositivo e por horário.
- [x] Condições por estado de dispositivo no motor de domínio.
- [x] Execução contínua pelo barramento de eventos e agendador do servidor.
- [x] Resultado total, parcial, falha e duplicidade por ação.
- [x] Deduplicação persistente por residência e `executionId`.
- [x] Detecção de ciclos diretos/indiretos e alerta de conflitos.
- [x] Persistência PostgreSQL de configurações, alertas e execuções.
- [x] Interface responsiva com carregamento, erro, vazio e feedback textual.

## Critérios de aceite

### Fluxo positivo

- Dado uma cena válida, quando o administrador a executa, então cada ação é processada e o resultado agregado é persistido.
- Dado um gatilho de dispositivo ou horário atendido, quando o motor o avalia, então a automação ativa executa a cena e registra sua última execução.

### Fluxo negativo

- Dado uma automação que fecha um ciclo entre gatilho e ação, quando ela é salva, então a API responde `AUTOMATION_LOOP_DETECTED` sem ativá-la.
- Dado uma ação crítica, quando ela é incluída em cena, então a API exige execução manual protegida e rejeita a cena.

### Fluxo alternativo

- Dado que parte dos dispositivos falha, quando a cena é executada, então o status é `partial` e o usuário recebe um alerta.
- Dado o mesmo evento novamente, quando o motor o recebe, então responde `duplicate` sem repetir comandos.
- Dado duas regras com o mesmo gatilho e valores incompatíveis, quando a segunda é salva, então o sistema mantém a configuração e cria alerta explícito de conflito.

## Dependências e riscos

- Depende do barramento interno, repositório residencial, PostgreSQL e adaptadores de integração.
- O agendamento usa o relógio/fuso do processo; uma evolução futura deve avaliar cada residência em seu fuso cadastrado.
- Dispositivos externos continuam sujeitos à disponibilidade e latência do provedor.

## Evidências técnicas

- `tests/orchestration.test.js`: total/parcial, condição, deduplicação, conflito, ciclo e agenda.
- `database/migrations/0006_orchestration_engine.sql`: histórico durável e chave idempotente.
- `docs/openapi.yaml` versão 1.9.0: contratos de cenas, automações e execuções.

## Definition of Done

- [x] Código e contrato revisados localmente.
- [x] Testes unitários do motor aprovados.
- [x] Pipeline DEV aprovado no PR #12.
- [x] Testes de integração e PostgreSQL aprovados em QA no PR #12.
- [x] E2E desktop/mobile, build, smoke, carga, segredos e CodeQL aprovados no PR #12.
- [ ] Deploy de produção validado por health check e smoke test.
