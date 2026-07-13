# Sprint 8 — Edição da planta e camadas

## Objetivo

Permitir que administradores ajustem a representação visual da residência com segurança, salvem e restaurem versões e alternem visualizações operacionais sem executar comandos acidentalmente.

## Histórias

- Como administrador, quero mover e redimensionar cômodos e reposicionar dispositivos para manter a planta fiel à residência.
- Como administrador, quero salvar e restaurar versões para recuperar rapidamente uma configuração anterior.
- Como morador, quero alternar camadas de temperatura, energia, câmeras e segurança para analisar a casa sem poluir a visualização padrão.
- Como editor, quero ser avisado antes de descartar um rascunho para não perder trabalho por engano.

## Critérios detalhados

- Dado o modo de edição, quando o usuário interage com um dispositivo, então comandos ficam bloqueados visual e semanticamente.
- Dado um cômodo, quando é movido ou redimensionado, então permanece dentro da planta e conserva dimensão mínima de 5%.
- Dado um rascunho alterado, quando o usuário troca de piso, tela ou fecha o navegador, então recebe um alerta antes do descarte.
- Dado um rascunho válido, quando é salvo, então posições e geometria são persistidas e uma nova versão é criada.
- Dado duas sessões na mesma versão, quando a segunda salva após a primeira, então recebe `VERSION_CONFLICT` sem sobrescrita silenciosa.
- Dado um histórico, quando uma versão anterior é restaurada, então o estado atual é preservado e uma nova versão auditada é criada.
- Dado geometria inválida, piso ou cômodo alheio, quando chega à API, então é rejeitada sem mutação.
- Dado as camadas operacionais, quando são alternadas, então temperatura, energia, câmeras e segurança aparecem somente onde aplicáveis.

## Dependências e riscos

- A geometria usa percentuais para permanecer responsiva em desktop e mobile.
- Conteúdo e histórico são segregados por residência e protegidos pelo RBAC existente.
- Snapshots não armazenam secrets; as proteções do upload SVG permanecem obrigatórias.
- Concorrência é protegida por versão otimista.

## Escopo

- Modo edição
- Reposicionar dispositivos
- Desenhar ou ajustar cômodos
- Salvar versão
- Restaurar versão
- Camadas de temperatura, energia, câmeras e segurança

## Critérios de aceite

- Modo edição bloqueia comandos
- Saída com alteração não salva gera alerta
- Versões podem ser restauradas
- Camadas podem ser ativadas e desativadas

## Testes obrigatórios

- Testes unitários dos componentes novos.
- Testes de API quando aplicável.
- Testes de integração quando aplicável.
- Testes de interface e regressão dos fluxos impactados.
- Evidências anexadas ao item de trabalho.

## Definition of Done

- [x] Código revisado.
- [x] Pipeline aprovado.
- [x] Critérios de aceite atendidos.
- [x] Documentação atualizada.
- [x] Deploy em QA concluído.
- [x] Aprovação de QA registrada.

## Evidências

- Gate DEV aprovado na branch `feat/sprint-08-floorplan-editing-layers`, run `29276126416`.
- Gate QA aprovado no PR #11: unitários, API/integração, PostgreSQL, E2E desktop/mobile, lint, tipos, build, smoke, carga concorrente, dependências, segredos e CodeQL.
- Contrato versionado em `docs/openapi.yaml` 1.8.0 e migração `database/migrations/0005_floorplan_versions.sql` validada em PostgreSQL.
- Cenários positivos, negativos e alternativos automatizados em `tests/floorplan.test.js`, `tests/home-domain-api.test.js`, `tests/postgres-home-domain.test.js` e `tests/e2e/auth.spec.js`.
