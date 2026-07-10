# Requisitos consolidados

## 1. Requisitos funcionais

- Autenticação, logout, recuperação de senha e sessão.
- Gestão de usuários, perfis, permissões e residências.
- Cadastro de casas, pisos, cômodos, plantas e dispositivos.
- Associação de dispositivos a cômodos e coordenadas da planta.
- Dashboard com segurança, internet, clima, energia, câmeras, automações e logs.
- Planta baixa com zoom, pan, centralização, camadas e tela cheia.
- Controle de iluminação, clima, tomadas, TVs, câmeras, fechaduras, portões e sensores.
- Atualização em tempo real.
- Cenas e automações com gatilho, condição e ação.
- Notificações, histórico, auditoria, importação e exportação.
- Integração com Home Assistant e Tuya/Smart Life.

## 2. Segurança

- Senhas com Argon2id ou bcrypt.
- Tokens de curta duração e refresh seguro.
- Autorização no backend.
- RBAC por residência.
- MFA/PIN para ações críticas.
- Proteção contra OWASP Top 10.
- TLS, secrets manager e criptografia de credenciais.
- Logs sem dados sensíveis.
- Atendimento à LGPD.

## 3. Arquitetura

- Frontend, API, domínio, persistência e integrações separados.
- Arquitetura modular.
- Portas e adaptadores para provedores.
- WebSocket, SSE ou MQTT para eventos em tempo real.
- Filas para processos demorados.
- APIs versionadas e documentadas.
- Baixo acoplamento e alta coesão.

## 4. Banco de dados

- Entidades: User, Role, Home, Floor, Room, FloorPlan, Device, DeviceState, Scene, Automation, Event, Notification, EnergyReading, Integration e AuditLog.
- Chaves, restrições e integridade referencial.
- Índices por residência, dispositivo, data, estado e integração.
- Migrações versionadas.
- Backups automáticos e teste de restauração.
- Retenção e exclusão lógica quando aplicável.

## 5. Desempenho

- Dashboard inicial em até 3 segundos em condição normal.
- Feedback local em até 300 ms.
- Planta fluida com pelo menos 200 dispositivos.
- Paginação, cache, lazy loading e virtualização.
- Limites de requisição e rate limiting.
- Testes de carga, estresse e volume.

## 6. Resiliência

- Timeout, retry com backoff e circuit breaker.
- Idempotência em comandos.
- Dead-letter queue para falhas.
- Health checks.
- Degradação controlada.
- Backup, rollback e recuperação de desastre.

## 7. Qualidade

- Testes unitários, API, integração, UI, E2E, segurança e desempenho.
- Cenários positivos, negativos e alternativos.
- Automação de fluxos críticos.
- Massa controlada.
- Evidências e rastreabilidade.

## 8. Observabilidade

- Logs estruturados.
- Correlation ID.
- Métricas técnicas e de negócio.
- Tracing distribuído.
- Dashboards e alertas.
- Retenção e mascaramento.

## 9. UX

- Tema escuro Nerd Edition.
- Cores neon com contraste.
- Interface responsiva.
- Navegação por teclado.
- Estados de loading, vazio, sucesso, erro e offline.
- Confirmação de ações críticas.
- Compatibilidade desktop, tablet e mobile.

## 10. DevOps

- Git e pull request obrigatório.
- CI/CD.
- SAST, dependências e secrets scan.
- Ambientes DEV, QA e PROD.
- Deploy versionado.
- Aprovação antes de produção.
- Infraestrutura como código.
- Rollback testado.

## 11. Documentação

- Requisitos, arquitetura, APIs, banco, instalação, operação, contingência, decisões técnicas e changelog.

## 12. Governança

- Product Owner, Tech Lead, QA e responsáveis por integração definidos.
- Definition of Ready e Definition of Done.
- Gestão de riscos, incidentes, defeitos e mudanças.
- SLIs, SLOs e indicadores de qualidade.
