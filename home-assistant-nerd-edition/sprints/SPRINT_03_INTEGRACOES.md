# Sprint 3 — Home Assistant e Tuya

## Objetivo

Entregar o escopo desta etapa com qualidade, rastreabilidade e capacidade de validação em QA.

## Histórias

- Como administrador, quero configurar Tuya ou Home Assistant no cofre da residência para conectar meus próprios dispositivos sem expor credenciais.
- Como administrador, quero testar e sincronizar uma integração para importar dispositivos sem duplicidade e conhecer o resultado da operação.
- Como morador, quero receber mudanças de estado externas em tempo real para que o painel represente o estado verdadeiro da casa.

## Critérios detalhados

- Dado um registro cifrado válido, quando a integração é usada, então as credenciais são abertas somente no backend e nunca retornam na resposta ou nos logs.
- Dado um dispositivo externo já importado, quando uma nova sincronização ocorre, então o mesmo registro é atualizado sem duplicidade.
- Dado um evento `state_changed`, quando ele pertence a um dispositivo importado, então estado, disponibilidade e versão são persistidos e publicados por SSE.
- Dado um provedor indisponível, quando health ou sync é solicitado, então a API responde com erro padronizado sem derrubar os demais provedores.
- Dado um usuário sem papel administrativo ou de outra residência, quando tenta configurar ou sincronizar, então a API rejeita sem revelar credenciais.

## Dependências e riscos

- Tuya exige Access ID, Access Secret e região correspondentes ao data center da conta vinculada.
- Na aplicação hospedada, Home Assistant exige URL HTTPS pública e Long-Lived Access Token; localhost, `.local` e IPs literais são bloqueados contra SSRF.
- Assinaturas são restabelecidas após nova sincronização ou reinicialização do serviço.
- O polling Tuya respeita `TUYA_POLL_INTERVAL_MS`; falhas isoladas não interrompem a aplicação.

## Escopo

- Criar interface comum de integração
- Implementar Home Assistant
- Implementar Tuya/Smart Life
- Sincronizar dispositivos
- Mapear capacidades
- Implementar health check, timeout e retry

## Critérios de aceite

- Dispositivos são importados sem duplicidade
- Estado externo atualiza a aplicação
- Falha de provedor não derruba a aplicação
- Credenciais ficam protegidas

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
