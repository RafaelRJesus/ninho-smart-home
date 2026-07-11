import 'dotenv/config';

const errors=[];const warnings=[];
const required=['AUTH_SECRET','CORS_ORIGIN'];
for(const key of required)if(!process.env[key])errors.push(`${key} não foi preenchida.`);
if(process.env.AUTH_SECRET&&process.env.AUTH_SECRET.length<64)errors.push('AUTH_SECRET deve possuir pelo menos 64 caracteres.');
if(process.env.CORS_ORIGIN==='*'||process.env.CORS_ORIGIN==='true')errors.push('CORS_ORIGIN deve informar a origem HTTPS exata.');
if(process.env.CORS_ORIGIN&&!/^https:\/\//.test(process.env.CORS_ORIGIN))warnings.push('CORS_ORIGIN não usa HTTPS; aceite apenas em homologação local.');
if(!process.env.METRICS_TOKEN)warnings.push('METRICS_TOKEN vazio deixa métricas sem autenticação.');
if(!process.env.DATABASE_URL)warnings.push('DATABASE_URL vazia: contas e cofre não terão persistência PostgreSQL.');
if(process.env.TURNSTILE_REQUIRED!=='true')warnings.push('TURNSTILE_REQUIRED não está ativo; login e cadastro não terão desafio anti-bot.');
if(process.env.TURNSTILE_REQUIRED==='true'&&(!process.env.TURNSTILE_SITE_KEY||!process.env.TURNSTILE_SECRET_KEY||!process.env.TURNSTILE_HOSTNAME))errors.push('Turnstile ativo exige SITE_KEY, SECRET_KEY e HOSTNAME.');
const smtpKeys=['SMTP_HOST','SMTP_USERNAME','SMTP_PASSWORD'];const smtpConfigured=smtpKeys.filter(key=>process.env[key]).length;
if(smtpConfigured>0&&smtpConfigured<smtpKeys.length)errors.push('SMTP parcialmente configurado; preencha HOST, USERNAME e PASSWORD.');
if(!smtpConfigured)warnings.push('SMTP vazio: recuperação de senha não enviará e-mail.');
if(!process.env.APP_URL)warnings.push('APP_URL vazia: links de recuperação usarão endereço local.');
if(!process.env.TUYA_ACCESS_ID||!process.env.TUYA_ACCESS_SECRET)warnings.push('Tuya não configurado; o sistema iniciará em demonstração.');
if(process.env.REQUIRE_HTTPS==='false')warnings.push('REQUIRE_HTTPS=false; use somente atrás de rede local controlada ou durante homologação.');

for(const message of warnings)process.stderr.write(`AVISO: ${message}\n`);
if(errors.length){for(const message of errors)process.stderr.write(`ERRO: ${message}\n`);process.exitCode=1;}else process.stdout.write('Ambiente de produção validado.\n');
