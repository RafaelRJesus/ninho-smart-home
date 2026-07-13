import express from 'express';
import expressRateLimit from 'express-rate-limit';
import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TuyaClient } from './tuya-client.js';
import { errorHandler, notFoundHandler, requestContext } from './core/http.js';
import { TokenService } from './security/token-service.js';
import { MemoryIdentityStore } from './infrastructure/memory-identity-store.js';
import { AuthService } from './application/auth-service.js';
import { createV1Router } from './routes/v1.js';
import { ProviderRegistry } from './integrations/provider-registry.js';
import { withResilience } from './integrations/resilience.js';
import { TuyaProvider } from './integrations/tuya/tuya-provider.js';
import { HomeAssistantProvider } from './integrations/home-assistant/home-assistant-provider.js';
import { EventBus } from './core/event-bus.js';
import { requireHttps, securityHeaders } from './security/hardening.js';
import { Metrics, metricsAuthorization } from './core/observability.js';
import { CredentialVault } from './security/credential-vault.js';
import { connectPostgres } from './infrastructure/postgres.js';
import { PostgresIdentityStore } from './infrastructure/postgres-identity-store.js';
import { TurnstileVerifier } from './security/turnstile.js';
import { MemoryHomeRepository } from './infrastructure/memory-home-repository.js';
import { PostgresHomeRepository } from './infrastructure/postgres-home-repository.js';
import { EmailSender } from './infrastructure/email-sender.js';
import { HomeIntegrationService } from './application/home-integration-service.js';
import { DashboardService } from './application/dashboard-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tuyaConfigured = Boolean(process.env.TUYA_ACCESS_ID && process.env.TUYA_ACCESS_SECRET);
const tuya = tuyaConfigured ? new TuyaClient({ accessId:process.env.TUYA_ACCESS_ID, accessSecret:process.env.TUYA_ACCESS_SECRET, region:process.env.TUYA_REGION }) : null;
if(process.env.NODE_ENV==='production'&&!process.env.AUTH_SECRET)throw new Error('AUTH_SECRET é obrigatório em produção.');
const databasePool=await connectPostgres();
const identity=databasePool?new PostgresIdentityStore(databasePool):new MemoryIdentityStore();
const homeRepository=databasePool?new PostgresHomeRepository(databasePool):new MemoryHomeRepository();
const tokens=new TokenService(process.env.AUTH_SECRET||crypto.randomBytes(32).toString('hex'));
const auth=new AuthService({identity,tokens,emailSender:new EmailSender()});
if(process.env.NODE_ENV==='production'&&!process.env.INTEGRATION_MASTER_KEY)throw new Error('INTEGRATION_MASTER_KEY é obrigatória em produção.');
const vault=new CredentialVault(process.env.INTEGRATION_MASTER_KEY,process.env.INTEGRATION_KEY_VERSION||'v1');
const turnstile=new TurnstileVerifier();
const providers=new ProviderRegistry();
const events=new EventBus();
const metrics=new Metrics();
const integrations=new HomeIntegrationService({identity,repository:homeRepository,vault,events});
const dashboard=new DashboardService({identity,repository:homeRepository,version:process.env.npm_package_version||'0.1.0'});
if(tuya)providers.register('tuya',withResilience(new TuyaProvider({client:tuya}),{timeoutMs:8000,retries:2}));
if(process.env.HOME_ASSISTANT_URL&&process.env.HOME_ASSISTANT_TOKEN)providers.register('home-assistant',withResilience(new HomeAssistantProvider({baseUrl:process.env.HOME_ASSISTANT_URL,token:process.env.HOME_ASSISTANT_TOKEN}),{timeoutMs:5000,retries:2}));

export function createApp(){
  const app=express();
  app.disable('x-powered-by');
  if(process.env.TRUST_PROXY==='true')app.set('trust proxy',1);
  app.use((req,res,next)=>express.json({limit:req.method==='PUT'&&/\/floorplan$/.test(req.path)?'3mb':'100kb'})(req,res,next));
  app.use(requestContext);
  app.use(securityHeaders);
  app.use(requireHttps);
  app.use(metrics.middleware());
  app.use('/api',expressRateLimit({windowMs:60000,limit:Number(process.env.API_RATE_LIMIT_MAX||300),skip:req=>req.path.startsWith('/health')}));
  app.use('/api/v1/auth',expressRateLimit({windowMs:60000,limit:Number(process.env.AUTH_RATE_LIMIT_MAX||20)}));
  app.use('/api/v1',createV1Router({auth,identity,tokens,providers,vault,credentialStore:identity,turnstile,homeRepository,events,integrations,dashboard,controlExternal:(homeId,device,controls)=>device.integrationId?integrations.command(homeId,device,controls):undefined}));
  app.get('/api/health',(_req,res)=>res.json({ok:true,uptime:Math.round(process.uptime()),timestamp:new Date().toISOString()}));
  app.get('/api/health/live',(_req,res)=>res.json({status:'alive'}));
  app.get('/api/health/ready',async(_req,res)=>{const integrations=await providers.health();const degraded=Object.values(integrations).some(item=>item?.status==='unavailable');res.status(degraded?503:200).json({status:degraded?'degraded':'ready',integrations});});
  app.get('/api/metrics',metricsAuthorization,(_req,res)=>res.json(metrics.snapshot()));
  const dist=path.resolve(__dirname,'../dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/,(_req,res)=>res.sendFile(path.join(dist,'index.html')));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app=createApp();
if(process.env.NODE_ENV!=='test'){
  const server=app.listen(process.env.PORT||3001,()=>console.log(`Ninho disponível na porta ${process.env.PORT||3001}`));
  const shutdown=()=>server.close(async()=>{await databasePool?.end();process.exit(0)});
  process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
