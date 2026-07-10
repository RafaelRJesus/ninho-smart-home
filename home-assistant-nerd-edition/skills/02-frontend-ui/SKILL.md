---
name: frontend-ui
description: Implementa a interface visual futurista, responsiva e acessível.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Padronizar o frontend do dashboard e da planta baixa interativa com tema Nerd Edition.

# Quando usar

Use ao desenvolver componentes, páginas, navegação, estados visuais, responsividade e acessibilidade.

# Entradas esperadas

- Wireframes
- Design tokens
- Contratos de API
- Regras de permissão
- Estados dos dispositivos

# Regras obrigatórias

- Usar componentes reutilizáveis.
- Não acoplar regra de negócio ao componente visual.
- Implementar loading, vazio, sucesso, erro e offline.
- Garantir navegação por teclado.
- Não usar somente cor para indicar status.

# Saídas esperadas

- Componentes reutilizáveis
- Páginas responsivas
- Estados visuais consistentes
- Testes de interface

# Restrições

Evitar bibliotecas visuais desnecessárias. Respeitar performance da planta e acessibilidade.

# Checklist de conclusão

- [ ] Responsivo
- [ ] Acessível
- [ ] Estados completos
- [ ] Testes criados
- [ ] Sem lógica de domínio no componente
