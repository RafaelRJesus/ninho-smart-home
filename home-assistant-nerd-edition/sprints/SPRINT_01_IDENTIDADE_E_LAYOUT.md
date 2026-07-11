# Sprint 1 — Identidade, autenticação e layout

## Objetivo

Como morador, quero acessar e recuperar minha conta em qualquer dispositivo para controlar somente as residências autorizadas com segurança e uma interface consistente.

## Escopo

- Implementar login, logout e recuperação de senha
- Criar RBAC inicial
- Criar shell da aplicação
- Criar menu lateral
- Criar tema Nerd Edition
- Implementar responsividade base

## Critérios de aceite

- Dado usuário autenticado, quando abrir a aplicação, então acessa o dashboard da residência autorizada.
- Dado usuário sem sessão, quando abrir uma rota da aplicação, então visualiza o login sem conteúdo residencial.
- Dado e-mail válido ou inexistente, quando solicitar recuperação, então recebe a mesma resposta genérica.
- Dado token válido, quando cadastrar senha com ao menos dez caracteres, então o token é consumido e as sessões anteriores são invalidadas.
- Dado token expirado, inválido ou já usado, quando tentar redefinir, então a operação é rejeitada sem alterar a senha.
- Dada mudança de página, quando navegar pelo menu, então o item atual fica destacado visual e semanticamente.
- Dado viewport desktop ou mobile, quando usar autenticação e navegação principal, então o conteúdo essencial permanece visível, rotulado e navegável por teclado.

## Exceções e riscos

- O endpoint nunca informa se o e-mail existe.
- Tokens são aleatórios, armazenados somente como SHA-256, expiram em 30 minutos e funcionam uma vez.
- A recuperação depende de SMTP configurado por ambiente; QA usa massa isolada.
- CAPTCHA protege solicitação e redefinição em produção.
- Nenhuma senha, token ou conteúdo do e-mail pode aparecer em log ou evidência de teste.

## Dependências

- `APP_URL` pública correta.
- Secrets SMTP exclusivos por ambiente.
- PostgreSQL com migration `0003_password_recovery.sql`.
- Chromium Playwright no ambiente QA.

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
