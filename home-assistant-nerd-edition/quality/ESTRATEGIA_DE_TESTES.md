# Estratégia de testes

## Pirâmide

- Unitários: regras, validações e mapeamentos.
- Integração: banco, cache, filas e provedores.
- API: autenticação, autorização, CRUD, comandos e erros.
- UI: componentes, responsividade e acessibilidade.
- E2E: fluxos críticos.
- Segurança: OWASP, RBAC, sessão e upload.
- Desempenho: carga, volume e estabilidade.

## Fluxos críticos

1. Login e expiração de sessão.
2. Seleção de residência.
3. Abertura da planta.
4. Zoom e pan.
5. Seleção de cômodo.
6. Ligar e desligar dispositivo.
7. Dispositivo offline.
8. Execução de cena.
9. Execução de automação.
10. Ação crítica com confirmação.
11. Perda e recuperação de conexão.
12. Sincronização Home Assistant/Tuya.

## Critérios de liberação

- 100% dos testes críticos aprovados.
- Nenhum defeito crítico ou alto aberto.
- Cobertura mínima definida pelo time.
- Smoke test aprovado em QA.
- Evidências anexadas.
