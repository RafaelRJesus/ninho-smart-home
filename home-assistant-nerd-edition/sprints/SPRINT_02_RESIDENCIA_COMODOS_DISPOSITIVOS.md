# Sprint 2 — Estrutura da residência

## Objetivo

Entregar o escopo desta etapa com qualidade, rastreabilidade e capacidade de validação em QA.

## Histórias

- Como proprietário, quero criar, consultar, atualizar e excluir residências para manter somente as casas que administro.
- Como proprietário ou administrador, quero organizar pisos e cômodos para representar a estrutura física da residência.
- Como proprietário ou administrador, quero cadastrar, mover, renomear e excluir dispositivos para manter o inventário correto.
- Como morador, quero visualizar o estado online/offline dos dispositivos sem poder alterar a estrutura quando não tiver permissão administrativa.

## Critérios detalhados

- Dado um recurso na versão atual, quando um administrador o altera, então a versão é incrementada e a ação é auditada.
- Dado um recurso alterado por outra sessão, quando uma versão antiga é enviada, então a API responde `409 VERSION_CONFLICT` sem sobrescrever dados.
- Dado um cômodo com o mesmo nome no piso, quando outro é criado ou renomeado, então a API responde `409 ROOM_ALREADY_EXISTS`.
- Dado um identificador externo já usado na residência, quando outro dispositivo é cadastrado, então a API responde `409 DEVICE_ALREADY_EXISTS`.
- Dado um usuário de outra residência ou sem papel administrativo, quando tenta alterar a estrutura, então a API responde `403` ou `404` sem revelar dados.
- Dado um piso ou cômodo com dependências, quando sua exclusão é solicitada, então a API bloqueia a operação e informa como resolver.

## Exceções, dependências e riscos

- A residência precisa manter ao menos um proprietário e uma estrutura mínima válida.
- A exclusão de residência é bloqueada quando é a única residência do proprietário.
- Migrações PostgreSQL devem ser aplicadas antes do deploy da API.
- O identificador externo é único por residência; integrações devem reutilizar o dispositivo existente durante sincronização.

## Escopo

- CRUD de residência
- CRUD de pisos
- CRUD de cômodos
- CRUD de dispositivos
- Associação dispositivo-cômodo
- Status online/offline
- Auditoria inicial

## Critérios de aceite

- Dados segregados por residência
- Nome do cômodo único por piso
- Dispositivo possui identificador único
- Alterações importantes são auditadas

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
