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
- Todo desenvolvimento começa na `main` atualizada e segue em branch nomeada como `tipo/nome-da-evolucao`.
- Branch de desenvolvimento executa lint, contratos, secret scan e testes unitários no ambiente DEV.
- Somente DEV aprovado pode abrir promoção para QA por pull request.
- QA executa testes unitários, integração, segurança, build, smoke e carga.
- Falha em QA bloqueia o merge e devolve a correção para a mesma branch; novo push recria QA.
- QA aprovado permite merge na `main`, que repete a regressão antes do deploy de produção.
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

- [ ] Branch de desenvolvimento nomeada
- [ ] Gate DEV aprovado
- [ ] Gate QA aprovado
- [ ] CI
- [ ] CD
- [ ] QA gate
- [ ] Segurança
- [ ] Rollback
