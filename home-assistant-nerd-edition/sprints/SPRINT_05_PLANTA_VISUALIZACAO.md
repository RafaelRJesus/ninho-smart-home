# Sprint 5 — Planta baixa: visualização

## Objetivo

Entregar o escopo desta etapa com qualidade, rastreabilidade e capacidade de validação em QA.

## Histórias

- Como administrador, quero enviar uma planta em SVG ou imagem para representar visualmente cada piso da residência.
- Como morador, quero alternar entre pisos e navegar com zoom, roda, mouse ou toque para localizar rapidamente um ambiente.
- Como morador, quero abrir a planta em tela cheia e selecionar um cômodo para inspecioná-lo com clareza.

## Critérios detalhados

- Dado um administrador da residência, quando envia PNG, JPEG, WebP ou SVG válido de até 2 MB, então o fundo é persistido somente no piso selecionado e a alteração é auditada.
- Dado um arquivo de tipo não permitido, acima do limite ou um SVG com script, evento, entidade ou referência externa, quando o upload é solicitado, então a API rejeita com erro padronizado e preserva a planta anterior.
- Dado um morador sem função administrativa ou de outra residência, quando tenta alterar a planta, então a API responde `403` sem persistir conteúdo.
- Dado que existem vários pisos, quando o usuário troca o piso ativo, então somente seus cômodos, dispositivos e fundo são renderizados.
- Dado zoom por botão, roda ou gesto com dois ponteiros, quando o usuário amplia ou reduz, então o valor permanece entre 60% e 250%.
- Dado um deslocamento ou zoom realizado, quando o usuário volta à planta durante a mesma sessão, então a visão do piso é restaurada.
- Dado um navegador compatível, quando o usuário solicita tela cheia, então a planta ocupa a viewport e oferece uma ação acessível para sair.
- Dado um cômodo visível, quando é selecionado por clique, toque ou teclado, então recebe identificação visual e seu nome é anunciado no painel contextual.

## Dependências e riscos

- O upload é armazenado no JSONB da planta nesta sprint; o limite de 2 MB evita crescimento irrestrito e deverá migrar para object storage caso o volume aumente.
- SVG é exibido como imagem e passa por validação defensiva; scripts, eventos inline, entidades, `foreignObject` e referências externas são bloqueados.
- A API Fullscreen depende de suporte do navegador; quando indisponível, a visualização continua funcional no modo normal.
- Gestos automatizados usam eventos de ponteiro equivalentes a dois dedos, sem depender da ordem de execução dos testes.

## Escopo

- Upload de planta
- Renderização por piso
- Zoom por botão e roda
- Pan por mouse e toque
- Centralização
- Tela cheia
- Seleção de cômodo

## Critérios de aceite

- Zoom respeita limites
- Pan é fluido
- Seleção abre painel correto
- Posição é mantida durante a sessão

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

- API e segurança do upload: `server/domain/floorplan.js`, `server/routes/home-domain.js` e `tests/home-domain-api.test.js`.
- Visualização por piso, upload, tela cheia e gestos: `src/components/FloorplanEditor.jsx`, `src/domain/floorplan.js` e `src/styles.css`.
- Testes unitários e de interface: `tests/floorplan.test.js` e `tests/e2e/auth.spec.js`.
- Contrato público atualizado: `docs/openapi.yaml` versão 1.5.0.
- Gate DEV aprovado no GitHub Actions e gate QA completo aprovado no PR #8 em 2026-07-13.
