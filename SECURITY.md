# Segurança

Não abra issues públicas contendo credenciais Tuya, tokens do Home Assistant, chaves OpenAI, dados pessoais ou detalhes da residência.

Ao relatar uma vulnerabilidade, use o recurso **Report a vulnerability** na aba Security do GitHub. Inclua impacto, passos mínimos de reprodução e versão afetada, removendo todos os secrets.

Credenciais ficam somente no `.env`, que é ignorado pelo Git. Em caso de exposição, revogue imediatamente a chave no respectivo provedor e gere outra.

## Cofre de integrações

Credenciais cadastradas pela interface são cifradas com AES-256-GCM, associadas à residência e ao provedor e persistidas sem texto puro. A chave `INTEGRATION_MASTER_KEY` permanece fora do armazenamento de dados. Para rotacionar, configure uma nova versão, regrave as credenciais e somente então revogue a chave anterior.

O plano gratuito do Render possui filesystem efêmero e deve ser usado apenas para demonstração sem credenciais reais. Uma instalação residencial deve usar volume persistente ou PostgreSQL, acesso privado e backup criptografado.

## Proteção anti-bot

Cloudflare Turnstile protege cadastro e login quando `TURNSTILE_REQUIRED=true`. O servidor sempre chama Siteverify, limita o token a 2048 caracteres, valida hostname/action e falha fechado em timeout ou configuração ausente. A secret key deve existir apenas no cofre de variáveis do Render e ser rotacionada após suspeita de exposição.

Recuperação de senha também exige Turnstile. Tokens possuem 256 bits aleatórios, são persistidos apenas como hash SHA-256, expiram em 30 minutos e são consumidos atomicamente. A alteração incrementa a versão de sessão do usuário, invalidando access e refresh tokens emitidos anteriormente. Credenciais SMTP são secrets exclusivos do ambiente.
