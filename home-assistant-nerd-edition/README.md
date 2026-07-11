# Home Assistant Nerd Edition

Pacote de especificação técnica para evolução da aplicação de automação residencial.

## Estrutura

- `skills/`: instruções especializadas para agentes de IA e desenvolvedores.
- `requirements/`: requisitos funcionais e não funcionais.
- `sprints/`: backlog dividido por sprint.
- `architecture/`: decisões e diretrizes técnicas.
- `quality/`: estratégia de testes e Definition of Done.
- `governance/`: riscos, dependências e responsabilidades.

## Princípios

1. Backend como fonte de verdade.
2. Integrações externas isoladas por adaptadores.
3. Atualização de estado em tempo real.
4. Ações críticas sempre confirmadas e auditadas.
5. Evolução incremental por sprint.
6. Segurança e observabilidade desde o início.

## Acompanhamento

O estado consolidado, as evidências e os checkboxes de cada entrega ficam em [`sprints/CONTROLE_DE_EVOLUCAO.md`](sprints/CONTROLE_DE_EVOLUCAO.md). Atualize esse arquivo no mesmo commit de cada evolução.
