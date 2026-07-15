# Sprint 10 — Notificações e energia

## Objetivo

Entregar o escopo desta etapa com qualidade, rastreabilidade e capacidade de validação em QA.

## Escopo

- Central de notificações
- Push e e-mail
- Horário silencioso
- Consumo diário e mensal
- Consumo por cômodo e dispositivo
- Custo estimado
- Alertas de consumo

## Critérios de aceite

- Usuário escolhe canais
- Notificação possui severidade
- Valores ausentes não são tratados como zero
- Tarifa é configurável

## Testes obrigatórios

- Testes unitários dos componentes novos.
- Testes de API quando aplicável.
- Testes de integração quando aplicável.
- Testes de interface e regressão dos fluxos impactados.
- Evidências anexadas ao item de trabalho.

## Definition of Done

- Código revisado.
- Pipeline aprovado.
- Critérios de aceite atendidos.
- Documentação atualizada.
- Deploy em QA concluído.
- Aprovação de QA registrada.

## Evidências de implementação

- Preferências, canais externos e horário silencioso: `server/routes/home-domain.js` e `src/components/AutomationCenter.jsx`.
- Agregações e validações: `server/domain/energy.js`.
- Persistência: `database/migrations/0007_notifications_energy.sql` e repositórios de memória/PostgreSQL.
- Testes: `tests/energy.test.js` e cenário Sprint 10 em `tests/home-domain-api.test.js`.
- Validação local em 2026-07-15: 72 testes aprovados, 1 teste PostgreSQL ignorado sem `TEST_DATABASE_URL`, lint, typecheck e build aprovados.

O sprint permanece pendente apenas do gate, deploy e aprovação formal de QA.
