# Fluxo obrigatório DEV → QA → produção

## História

Como equipe de desenvolvimento, queremos promover mudanças por ambientes isolados para impedir que código sem validação alcance a `main` e a produção.

## Fluxo

1. Atualize a `main` local e crie uma branch com o tipo e o nome da evolução:

   ```bash
   git switch main
   git pull --ff-only
   git switch -c feat/nome-da-evolucao
   ```

   Tipos aceitos: `feat/`, `fix/`, `chore/`, `docs/`, `test/` e `refactor/`.

2. Desenvolva no ambiente DEV. Nunca desenvolva diretamente na `main`.
3. Antes de publicar a branch, execute lint, contratos e testes unitários:

   ```bash
   npm run lint
   npm run typecheck
   npm run test:unit
   npm run security:secrets
   ```

4. O push da branch executa `DEV Validation` no GitHub.
5. Com DEV aprovado, abra pull request para `main`. O PR cria o ambiente QA efêmero e executa:
   - unitários e integração;
   - análise estática e auditoria de dependências;
   - build de produção;
   - smoke test;
   - teste de carga;
   - CodeQL e secret scan.
6. Se QA falhar, não faça merge. Retorne à mesma branch, corrija a causa, rode os testes locais e publique novos commits. O GitHub cancela a execução antiga e recria QA a partir da branch corrigida.
7. Com todos os checks verdes e conversas resolvidas, faça merge linear na `main`.
8. O merge recria a aplicação a partir da `main`, repete a regressão completa e permite o deploy rastreável em produção.
9. Se a validação pós-merge falhar, interrompa o deploy ou execute o rollback do `RUNBOOK_PRODUCAO.md`; abra uma branch `fix/` a partir da `main` e reinicie o fluxo.

## Critérios Dado/Quando/Então

- Dado um desenvolvimento novo, quando o trabalho começar, então ele ocorre em branch nomeada e ambiente DEV.
- Dado DEV aprovado, quando o pull request for aberto, então QA executa todas as suítes sem reutilizar secrets de produção.
- Dado qualquer falha em QA, quando um check reprovar, então o merge permanece bloqueado e a correção volta para a branch.
- Dado QA aprovado, quando o PR for integrado, então a `main` repete a validação antes da promoção para produção.
- Dado falha pós-merge, quando produção estiver em risco, então a equipe interrompe a promoção e aplica o runbook de rollback.

## Restrições de segurança

- DEV, QA e produção usam secrets independentes.
- Nenhum dump ou dado residencial real é usado em DEV ou QA.
- A `main` não aceita force push, exclusão ou merge com check obrigatório pendente.
- Evidências ficam nos checks do pull request e no controle de evolução.
