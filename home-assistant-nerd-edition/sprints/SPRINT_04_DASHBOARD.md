# Sprint 4 — Dashboard operacional

## Objetivo

Entregar o escopo desta etapa com qualidade, rastreabilidade e capacidade de validação em QA.

## Histórias

- Como morador, quero visualizar a situação operacional da residência em um único painel para identificar rapidamente falhas e itens que exigem atenção.
- Como morador, quero controlar as luzes pelo painel e receber atualizações em tempo real para não precisar recarregar a página.
- Como administrador, quero consultar atividade, automações recentes e informações do sistema para diagnosticar o funcionamento da casa.

## Critérios detalhados

- Dado um usuário autenticado e autorizado, quando abre o dashboard, então recebe somente o snapshot da residência selecionada.
- Dado o backend respondendo em condição normal, quando o dashboard é aberto, então o estado pronto aparece em menos de três segundos.
- Dado que ainda não existem luzes, energia, clima, câmeras, automações ou atividade, quando o bloco é exibido, então informa explicitamente que não há dados, sem representar ausência como zero medido.
- Dado um erro na API, quando o snapshot não pode ser carregado, então o painel exibe mensagem segura e uma ação para tentar novamente.
- Dado que a conexão foi perdida após um snapshot válido, quando o painel continua aberto, então mantém os últimos dados, identifica que podem estar desatualizados e oferece reconexão.
- Dado um evento de dispositivo da residência, quando ele chega via SSE, então o estado visível e o snapshot operacional são atualizados sem recarregar a página.
- Dado um usuário de outra residência, quando solicita o dashboard, então recebe `403` sem acessar indicadores, atividade ou dispositivos alheios.

## Dependências e riscos

- Segurança é derivada de alertas críticos não lidos; não substitui uma central de alarme certificada.
- Internet representa a saúde das integrações configuradas, não um teste físico do roteador ou da operadora.
- Câmeras são exibidas somente quando o provedor as importa com categoria `camera`; streaming de vídeo não pertence a esta sprint.
- O gráfico usa as sete leituras de energia mais recentes e distingue ausência de medição de consumo igual a zero.

## Escopo

- Cards de segurança, internet, energia, clima e dispositivos
- Lista de luzes
- Painel de clima
- Gráfico de energia
- Automações recentes
- Logs de atividade
- Informações do sistema

## Critérios de aceite

- Dashboard carrega em até 3 segundos em condição normal
- Estados loading, vazio, erro e offline disponíveis
- Dados atualizam sem recarregar a página

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
