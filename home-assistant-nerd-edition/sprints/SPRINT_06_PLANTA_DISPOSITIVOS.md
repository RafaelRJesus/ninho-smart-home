# Sprint 6 — Planta baixa: dispositivos

## Objetivo

Entregar o escopo desta etapa com qualidade, rastreabilidade e capacidade de validação em QA.

## Histórias

- Como morador, quero identificar e selecionar cada dispositivo na planta para consultar seu estado e controlá-lo no contexto do ambiente.
- Como morador, quero receber feedback imediato ao ligar ou desligar um dispositivo para saber que meu comando está sendo processado.
- Como administrador, quero reposicionar os pontos dos dispositivos e manter suas coordenadas para que a planta represente a instalação real.

## Critérios detalhados

- Dado um dispositivo com coordenadas válidas, quando a planta ou a página é recarregada, então seu ícone permanece na mesma posição e categoria.
- Dado um dispositivo online, quando o usuário envia um comando de energia, então a interface exibe estado pendente imediatamente e só confirma o estado retornado pelo backend.
- Dado que o provedor ou backend rejeita o comando, quando a resposta de falha chega, então a interface restaura energia e versão anteriores, marca erro com ícone e texto e permite nova tentativa.
- Dado um dispositivo offline ou em erro, quando o usuário tenta controlá-lo, então o backend rejeita com código padronizado sem alterar o estado persistido.
- Dado um dispositivo selecionado, quando o usuário usa clique, toque ou teclado, então abre um painel contextual com nome, ambiente, conectividade, energia e estado do comando.
- Dado que o modo de edição está ativo, quando o usuário interage com um ponto, então apenas o reposicionamento é permitido e nenhum comando é disparado.
- Dado um usuário de outra residência, quando tenta posicionar ou controlar o dispositivo, então recebe `403` ou `404` sem descobrir nem alterar o recurso.

## Dependências e riscos

- O retorno do backend é a fonte de verdade; o estado otimista existe somente durante a requisição e precisa preservar a versão anterior para rollback.
- Integrações externas podem falhar ou expirar; erros externos devem ser normalizados e nunca podem incluir credenciais.
- O estado visual usa texto, ícone, `aria-live` e forma, sem depender exclusivamente de cor.
- Coordenadas continuam limitadas entre 0 e 100 e comandos permanecem bloqueados durante a edição.

## Escopo

- Posicionar dispositivos
- Renderizar ícones por categoria
- Exibir estados ligado/desligado/offline/erro
- Selecionar dispositivo
- Abrir painel contextual
- Enviar comando ligar/desligar

## Critérios de aceite

- Ícone mantém coordenada
- Comando possui feedback imediato
- Estado final depende da confirmação do backend
- Falha restaura o estado visual

## Testes obrigatórios

- Testes unitários dos componentes novos.
- Testes de API quando aplicável.
- Testes de integração quando aplicável.
- Testes de interface e regressão dos fluxos impactados.
- Evidências anexadas ao item de trabalho.

## Definition of Done

- [ ] Código revisado.
- [ ] Pipeline aprovado.
- [ ] Critérios de aceite atendidos.
- [ ] Documentação atualizada.
- [ ] Deploy em QA concluído.
- [ ] Aprovação de QA registrada.
