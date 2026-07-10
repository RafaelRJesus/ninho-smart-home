---
name: qa-testing
description: Define cobertura de testes funcionais, integração, interface, segurança e desempenho.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Garantir qualidade contínua e rastreabilidade entre requisito, teste e evidência.

# Quando usar

Use na criação de cenários, automação, regressão, testes de API, UI e integrações.

# Entradas esperadas

- História
- Critérios de aceite
- Contratos
- Riscos
- Massa de teste

# Regras obrigatórias

- Cobrir positivo, negativo e alternativo.
- Automatizar fluxos críticos.
- Isolar massa de teste.
- Registrar evidência.
- Não aprovar com defeito crítico aberto.

# Saídas esperadas

- Casos de teste
- Automação
- Evidências
- Relatório de execução
- Critério de go/no-go

# Restrições

Testes não podem depender de ordem de execução. Dados sensíveis não podem aparecer em evidências.

# Checklist de conclusão

- [ ] Cobertura
- [ ] Automação
- [ ] Evidências
- [ ] Regressão
- [ ] Aprovação registrada
