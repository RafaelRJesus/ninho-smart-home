---
name: devops-delivery
description: Define CI/CD, ambientes, infraestrutura, migrações e rollback.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Garantir entregas automatizadas, rastreáveis e reversíveis.

# Quando usar

Use ao configurar repositório, pipeline, ambientes, deploy e infraestrutura.

# Entradas esperadas

- Código
- Testes
- Configurações
- Migrações
- Infraestrutura

# Regras obrigatórias

- Pull request obrigatório.
- Testes e análise de segurança no pipeline.
- Configuração por ambiente.
- Deploy rastreável.
- Rollback validado.

# Saídas esperadas

- Pipeline CI/CD
- Ambientes segregados
- Release versionada
- Runbook de rollback

# Restrições

Não permitir deploy direto em produção. Não reutilizar secrets entre ambientes.

# Checklist de conclusão

- [ ] CI
- [ ] CD
- [ ] QA gate
- [ ] Segurança
- [ ] Rollback
