# Segurança

Não abra issues públicas contendo credenciais Tuya, tokens do Home Assistant, chaves OpenAI, dados pessoais ou detalhes da residência.

Ao relatar uma vulnerabilidade, use o recurso **Report a vulnerability** na aba Security do GitHub. Inclua impacto, passos mínimos de reprodução e versão afetada, removendo todos os secrets.

Credenciais ficam somente no `.env`, que é ignorado pelo Git. Em caso de exposição, revogue imediatamente a chave no respectivo provedor e gere outra.
