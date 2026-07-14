# Home Assistant Nerd Edition

Pacote de especificação técnica para evolução da aplicação de automação residencial.

## Estrutura versionada

- `sprints/`: backlog, progresso e evidências divididos por sprint.

As referências internas de arquitetura, governança, qualidade, requisitos e skills são mantidas apenas no ambiente local e não são publicadas no repositório.

## Princípios

1. Backend como fonte de verdade.
2. Integrações externas isoladas por adaptadores.
3. Atualização de estado em tempo real.
4. Ações críticas sempre confirmadas e auditadas.
5. Evolução incremental por sprint.
6. Segurança e observabilidade desde o início.

## Acompanhamento

O estado consolidado, as evidências e os checkboxes de cada entrega ficam em [`sprints/CONTROLE_DE_EVOLUCAO.md`](sprints/CONTROLE_DE_EVOLUCAO.md). Atualize esse arquivo no mesmo commit de cada evolução.

Todo desenvolvimento segue obrigatoriamente o fluxo documentado em [`../docs/FLUXO_DEV_QA_PRODUCAO.md`](../docs/FLUXO_DEV_QA_PRODUCAO.md): branch nomeada em DEV, promoção por pull request para QA e merge protegido na `main`.
