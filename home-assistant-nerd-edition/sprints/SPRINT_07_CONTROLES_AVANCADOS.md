# Sprint 7 — Controles avançados

## Objetivo

Entregar controles avançados orientados pelas capacidades reais de cada dispositivo, com autorização residencial, confirmação explícita e PIN nas ações críticas.

## Histórias

- Como morador autorizado, quero ajustar cor, clima e mídia somente quando o dispositivo oferecer essas capacidades para evitar comandos incompatíveis.
- Como administrador, quero controlar câmeras, fechaduras e portões com confirmação e PIN para reduzir o risco de ações acidentais ou indevidas.
- Como morador, quero receber estados de carregamento, sucesso, erro e indisponibilidade para entender o resultado de cada comando.

## Critérios detalhados

- Dado um dispositivo com capacidades declaradas, quando seu painel é aberto, então somente controles legíveis e graváveis compatíveis com essas capacidades são exibidos.
- Dado brilho, volume, temperatura, cor ou posição inválidos, quando o comando chega à API, então ele é rejeitado com `VALIDATION_ERROR` sem alterar o estado persistido.
- Dado um televisor compatível, quando o usuário altera volume ou envia reproduzir, pausar, parar, silenciar ou trocar canal, então o backend confirma o comando antes de persistir o estado final.
- Dado uma fechadura, portão ou câmera, quando o usuário tenta executar uma ação crítica, então a interface exige confirmação explícita e PIN antes do envio.
- Dado PIN ausente ou inválido, quando uma ação crítica é solicitada, então a API responde `ACTION_PIN_REQUIRED`, não chama o provedor e não altera o dispositivo.
- Dado um membro sem papel administrativo, quando tenta controlar câmera, fechadura ou portão, então recebe `403` sem descobrir credenciais ou detalhes internos.
- Dado falha do provedor, quando o comando é rejeitado, então a interface restaura o estado anterior, apresenta erro acessível e oferece nova tentativa.
- Dado dispositivo offline ou capacidade não suportada, quando o painel é aberto, então os controles correspondentes ficam ausentes ou indisponíveis com explicação textual.

## Dependências e riscos

- Tuya e Home Assistant possuem códigos diferentes; os adaptadores devem convertê-los para capacidades canônicas sem expor definições sensíveis.
- Câmeras nesta sprint recebem ações de privacidade e captura; transmissão de vídeo exige protocolo e política próprios e não será inferida.
- O PIN continua armazenado somente como hash no ambiente do servidor e nunca é persistido no estado do dispositivo ou em logs.
- O backend permanece como fonte de verdade e audita capability, resultado e `correlationId`, sem registrar o valor do PIN.

## Escopo

- Brilho e cor
- Climatização
- TV e mídia
- Fechaduras e portões
- Câmeras
- Confirmação e PIN para ações críticas

## Critérios de aceite

- Somente capacidades suportadas aparecem
- Valores inválidos são bloqueados
- Ações críticas exigem confirmação
- Câmera respeita permissão

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
