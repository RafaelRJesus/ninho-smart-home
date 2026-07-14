# Sprint 20 — Fundação do frontend

## Objetivo

Separar infraestrutura de interface, sessão, estado e módulos funcionais no React.

## Escopo

- Estrutura `app`, `features`, `shared` e `design-system`.
- Cliente HTTP único com CSRF, refresh, timeout e erros tipados.
- Providers de sessão, residência e notificações.
- Roteamento e carregamento por página.
- Estados de servidor fora dos componentes visuais.
- Remoção gradual de chamadas `fetch` diretas.

## Critérios de aceite

- Componentes visuais não conhecem URLs, cookies ou formato bruto de erro.
- Renovação de sessão é coordenada e não gera múltiplas tentativas concorrentes.
- Cada feature expõe API pública mínima e testável.

## Definition of Done

- [ ] Cliente HTTP e providers implementados.
- [ ] Shell e autenticação migrados.
- [ ] Testes de componentes, sessão e acessibilidade aprovados.
- [ ] Gates DEV e QA aprovados.
