# Matriz inicial de rastreabilidade

| ID | História | Critério principal | Sprint | Teste esperado |
|---|---|---|---|---|
| AUTH-01 | Como usuário, quero iniciar sessão para acessar minhas casas | Dado usuário válido, quando autenticar, então recebe sessão segura | 1 | API + E2E |
| HOME-01 | Como proprietário, quero cadastrar residência, piso e cômodo | Dado nome único no piso, quando salvar, então estrutura é persistida | 2 | Unitário + API |
| INT-01 | Como morador, quero sincronizar Tuya sem duplicar aparelhos | Dado mesmo ID externo, quando sincronizar, então atualiza um único registro | 3 | Contrato + integração |
| CMD-01 | Como morador, quero controlar um dispositivo com confirmação | Dado requestId, quando comando repetir, então não executa duas vezes | 3/6 | Unitário + API + E2E |
| FLOOR-01 | Como morador, quero navegar pela planta | Dado planta aberta, quando usar zoom/pan, então limites e posição são preservados | 5 | UI + E2E |
| SEC-01 | Como proprietário, quero confirmar ação crítica | Dado ação crítica, quando não informar PIN válido, então comando é negado | 7/11 | Segurança + E2E |
