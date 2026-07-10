---
name: floorplan-engine
description: Implementa a planta baixa interativa com zoom, pan, seleção e controle de dispositivos.
version: 1.0.0
owner: Home Assistant Nerd Edition
---

# Objetivo

Permitir navegação fluida pela planta e controle contextual de dispositivos por cômodo.

# Quando usar

Use em toda atividade relacionada à renderização, edição, camadas, posicionamento e interação da planta.

# Entradas esperadas

- Planta SVG/imagem
- Cômodos
- Dispositivos
- Coordenadas
- Camadas

# Regras obrigatórias

- Suportar zoom por botão, roda e gesto.
- Suportar pan por mouse e toque.
- Preservar posição durante a sessão.
- Diferenciar ligado, desligado, offline e erro.
- Impedir comandos no modo edição.

# Saídas esperadas

- Canvas/planta interativa
- Painel contextual
- Modo edição
- Persistência de coordenadas
- Testes de interação

# Restrições

Manter fluidez com pelo menos 200 dispositivos. Evitar renderizações completas desnecessárias.

# Checklist de conclusão

- [ ] Zoom
- [ ] Pan
- [ ] Seleção de cômodo
- [ ] Seleção de dispositivo
- [ ] Estados visuais
- [ ] Teste mobile
