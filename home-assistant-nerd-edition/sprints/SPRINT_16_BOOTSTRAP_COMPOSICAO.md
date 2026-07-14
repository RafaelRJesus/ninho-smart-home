# Sprint 16 — Bootstrap e composição

## Objetivo

Separar configuração, composição de dependências, aplicação HTTP, workers e ciclo de vida do processo.

## Escopo

- `loadConfig()` com schema tipado e validação por ambiente.
- `createContainer()` para repositórios, serviços, providers e segurança.
- `createHttpApp(container)` sem efeitos colaterais.
- `startServer()` e workers independentes.
- Inicialização e encerramento ordenados de banco, HTTP e scheduler.

## Critérios de aceite

- Importar a aplicação em testes não abre porta, banco ou timer.
- Dependências podem ser substituídas sem alterar rotas.
- Falha de inicialização encerra o processo com log estruturado e sem estado parcial.

## Definition of Done

- [ ] Bootstrap dividido e coberto por testes.
- [ ] Configuração validada antes da composição.
- [ ] Shutdown gracioso testado.
- [ ] Gates DEV e QA aprovados.

