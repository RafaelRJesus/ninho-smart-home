# Sprint 21 — Residência e planta em camadas

## Objetivo

Migrar casas, pisos, cômodos e planta para as novas fronteiras de domínio, aplicação, API e frontend.

## Escopo

- Casos de uso residenciais e de planta.
- Políticas de segregação, edição e versionamento.
- Controllers e repositórios modulares.
- Features React para residência, ambientes e editor da planta.
- Upload seguro, histórico e conflitos preservados.

## Critérios de aceite

- Nenhuma residência acessa ou referencia recursos de outra.
- Edição concorrente mantém controle otimista e restauração.
- Funcionalidade e experiência existentes não sofrem regressão.

## Definition of Done

- [ ] Backend residencial e planta migrados.
- [ ] Frontend modular correspondente entregue.
- [ ] Segregação, E2E desktop/mobile e concorrência aprovados.
- [ ] Gates DEV e QA aprovados.
