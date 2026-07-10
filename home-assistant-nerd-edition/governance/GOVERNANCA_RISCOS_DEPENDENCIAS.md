# Governança, riscos e dependências

## Papéis

- Product Owner: priorização e aceite funcional.
- Tech Lead: arquitetura e decisões técnicas.
- QA: estratégia, execução, evidências e go/no-go.
- DevOps: pipeline, ambientes e operação.
- Segurança: revisão de riscos e LGPD.
- Responsável por integração: Home Assistant/Tuya.

## Riscos principais

- Divergência de estado entre aplicação e dispositivo.
- Indisponibilidade de provedores.
- Planta com muitos elementos e baixa performance.
- Credenciais expostas.
- Automação em loop.
- Ação crítica executada sem confirmação.
- Dispositivos duplicados após sincronização.
- Falha na segregação entre residências.

## Dependências

- Conta e credenciais válidas dos provedores.
- Data center correto da Tuya.
- Planta baixa em formato compatível.
- Infraestrutura de WebSocket/MQTT.
- Serviço de notificações.
- Observabilidade e secrets manager.

## Gates de release

- Segurança aprovada.
- Regressão aprovada.
- Performance dentro dos limites.
- Backup e rollback testados.
- Monitoramento ativo.
