import crypto from 'node:crypto';

Object.assign(process.env,{
  NODE_ENV:'development',
  PORT:'3201',
  AUTH_SECRET:crypto.randomBytes(32).toString('hex'),
  INTEGRATION_MASTER_KEY:crypto.randomBytes(32).toString('hex'),
  REQUIRE_HTTPS:'false',
  TURNSTILE_REQUIRED:'false',
  DATABASE_URL:'',
  AUTH_RATE_LIMIT_MAX:'200',
});

await import('../server/index.js');
