import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const port=3198;const base=`http://127.0.0.1:${port}`;const concurrency=Number(process.env.STRESS_CONNECTIONS||40);const durationSeconds=Number(process.env.STRESS_DURATION_SECONDS||6);const maxP99=Number(process.env.STRESS_MAX_P99_MS||1500);
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,NODE_ENV:'production',PORT:String(port),AUTH_SECRET:'stress-auth-secret-'.padEnd(64,'0'),INTEGRATION_MASTER_KEY:Buffer.alloc(32,8).toString('base64'),REQUIRE_HTTPS:'false',TURNSTILE_REQUIRED:'false',TUYA_ACCESS_ID:'',TUYA_ACCESS_SECRET:'',DATABASE_URL:'',DATA_FILE:'./data/stress-state.json'},stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',chunk=>serverOutput+=chunk);server.stderr.on('data',chunk=>serverOutput+=chunk);
const wait=ms=>new Promise(resolve=>{setTimeout(resolve,ms)});
const percentile=(values,p)=>values.sort((a,b)=>a-b)[Math.min(values.length-1,Math.ceil(values.length*p)-1)]||0;

async function awaitServer(){for(let attempt=0;attempt<60;attempt++){try{const response=await fetch(`${base}/api/health/live`);if(response.ok)return;}catch{}await wait(250);}throw new Error(`Servidor de stress não iniciou.\n${serverOutput}`);}
async function load(name,path,{headers={},accepted=[200]}={}){const end=Date.now()+durationSeconds*1000;const latencies=[];const statuses={};let networkErrors=0;async function worker(){while(Date.now()<end){const started=performance.now();try{const response=await fetch(`${base}${path}`,{headers});await response.arrayBuffer();latencies.push(performance.now()-started);statuses[response.status]=(statuses[response.status]||0)+1;}catch{networkErrors++;}}}await Promise.all(Array.from({length:concurrency},worker));const total=Object.values(statuses).reduce((sum,value)=>sum+value,0);const result={name,total,requestsPerSecond:Number((total/durationSeconds).toFixed(1)),p95Ms:Number(percentile([...latencies],.95).toFixed(1)),p99Ms:Number(percentile([...latencies],.99).toFixed(1)),networkErrors,statuses};const serverErrors=Object.entries(statuses).filter(([status])=>Number(status)>=500).reduce((sum,[,value])=>sum+value,0);if(networkErrors||serverErrors||result.p99Ms>maxP99||!accepted.some(status=>statuses[status]))throw new Error(`${name} reprovado: ${JSON.stringify(result)}`);process.stdout.write(`${JSON.stringify(result)}\n`);return result;}

try{
  await awaitServer();
  const registration=await fetch(`${base}/api/v1/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({displayName:'Stress Test',email:'stress@ninho.local',password:'senha-segura-stress'})});if(!registration.ok)throw new Error(`Preparação da sessão falhou: ${await registration.text()}`);const rawCookie=registration.headers.get('set-cookie')||'';const access=rawCookie.match(/ninho_access=[^;]+/)?.[0];if(!access)throw new Error('Cookie de acesso não foi emitido.');
  await load('health-under-load','/api/health/live');
  const protectedResult=await load('authenticated-api-with-load-shedding','/api/devices',{headers:{Cookie:access},accepted:[200,429]});if(!protectedResult.statuses[200])throw new Error('API não respondeu nenhuma solicitação com sucesso.');
  const recovery=await fetch(`${base}/api/health/ready`);if(!recovery.ok)throw new Error(`Serviço não se recuperou: ${recovery.status}`);
  process.stdout.write(`Stress aprovado com ${concurrency} conexões por ${durationSeconds}s; serviço saudável após o pico.\n`);
}finally{server.kill('SIGTERM');await wait(200);}
