import { spawn } from 'node:child_process';

const port=3199;const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'production',PORT:String(port),AUTH_SECRET:'smoke-auth-secret-'.padEnd(64,'0'),INTEGRATION_MASTER_KEY:Buffer.alloc(32,9).toString('base64'),REQUIRE_HTTPS:'false',TURNSTILE_REQUIRED:'false',TUYA_ACCESS_ID:'',TUYA_ACCESS_SECRET:'',DATABASE_URL:''},stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',chunk=>output+=chunk);server.stderr.on('data',chunk=>output+=chunk);
const wait=ms=>new Promise(resolve=>{setTimeout(resolve,ms)});
async function request(path){const response=await fetch(`${base}${path}`);return {response,body:await response.text()};}
try{
  let live;for(let attempt=0;attempt<30;attempt++){try{live=await request('/api/health/live');if(live.response.ok)break;}catch{}await wait(250);}
  if(!live?.response.ok)throw new Error(`Servidor não ficou saudável.\n${output}`);
  const ready=await request('/api/health/ready');if(!ready.response.ok)throw new Error(`Readiness falhou: ${ready.body}`);
  const protectedRoute=await request('/api/v1/homes');if(protectedRoute.response.status!==401)throw new Error(`API protegida respondeu ${protectedRoute.response.status}.`);
  const page=await request('/');if(!page.response.ok||!page.body.includes('id="root"'))throw new Error('Frontend de produção não foi servido.');
  process.stdout.write('Smoke test aprovado: live, ready, autenticação e frontend.\n');
}finally{server.kill('SIGTERM');}
