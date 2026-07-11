import express from 'express';
import cors from 'cors';
import expressRateLimit from 'express-rate-limit';
import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TuyaClient, commandFor, inferType, normalizedStatusValue, statusValue } from './tuya-client.js';
import { Store } from './store.js';
import { understand } from './assistant.js';
import { validateDevicePatch } from './domain/device.js';
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
import { OrchestrationService } from './application/orchestration-service.js';
import { requireCriticalPin, requireHttps, securityHeaders } from './security/hardening.js';
import { Metrics, metricsAuthorization } from './core/observability.js';
import { CredentialVault } from './security/credential-vault.js';
import { authenticate } from './security/auth-middleware.js';
import { connectPostgres } from './infrastructure/postgres.js';
import { PostgresIdentityStore } from './infrastructure/postgres-identity-store.js';
import { TurnstileVerifier } from './security/turnstile.js';
import { MemoryHomeRepository } from './infrastructure/memory-home-repository.js';
import { PostgresHomeRepository } from './infrastructure/postgres-home-repository.js';
import { EmailSender } from './infrastructure/email-sender.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const store = new Store();
const tuyaConfigured = Boolean(process.env.TUYA_ACCESS_ID && process.env.TUYA_ACCESS_SECRET);
const tuya = tuyaConfigured ? new TuyaClient({ accessId: process.env.TUYA_ACCESS_ID, accessSecret: process.env.TUYA_ACCESS_SECRET, region: process.env.TUYA_REGION }) : null;
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) throw new Error('AUTH_SECRET é obrigatório em produção.');
const databasePool=await connectPostgres();
const identity = databasePool?new PostgresIdentityStore(databasePool):new MemoryIdentityStore();
const homeRepository=databasePool?new PostgresHomeRepository(databasePool):new MemoryHomeRepository();
const tokens = new TokenService(process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex'));
const auth = new AuthService({ identity, tokens, emailSender:new EmailSender() });
if(process.env.NODE_ENV==='production'&&!process.env.INTEGRATION_MASTER_KEY)throw new Error('INTEGRATION_MASTER_KEY é obrigatória em produção.');
const vault = new CredentialVault(process.env.INTEGRATION_MASTER_KEY,process.env.INTEGRATION_KEY_VERSION||'v1');
const turnstile = new TurnstileVerifier();
const providers = new ProviderRegistry();
const events = new EventBus();
const orchestration = new OrchestrationService({ store, controlDevice, events });
const metrics = new Metrics();
if (tuya) providers.register('tuya', withResilience(new TuyaProvider({ client: tuya }), { timeoutMs: 8000, retries: 2 }));
if (process.env.HOME_ASSISTANT_URL && process.env.HOME_ASSISTANT_TOKEN) providers.register('home-assistant', withResilience(new HomeAssistantProvider({ baseUrl: process.env.HOME_ASSISTANT_URL, token: process.env.HOME_ASSISTANT_TOKEN }), { timeoutMs: 5000, retries: 2 }));

async function getTuyaDevices() {
  const cloudDevices = await tuya.listDevices();
  return Promise.all(cloudDevices.map(async cloud => {
    const [status, functionsResult] = await Promise.all([tuya.getStatus(cloud.id).catch(() => cloud.status || []), tuya.getFunctions(cloud.id).catch(() => ({ functions: [] }))]);
    const functions = functionsResult?.functions || functionsResult || [];
    const position = store.layout(cloud.id);
    const type = inferType(cloud.category, functions);
    return {
      id: cloud.id, name: cloud.name || cloud.custom_name || 'Dispositivo Tuya', room: position.room || 'Minha casa', type,
      online: cloud.online !== false,
      power: Boolean(statusValue(status, ['switch_led', 'switch_1', 'switch', 'switch_power', 'power'], false)),
      brightness: normalizedStatusValue(status, functions, ['bright_value_v2', 'bright_value', 'brightness', 'bright'], 50, 'brightness'),
      temperature: normalizedStatusValue(status, functions, ['temp_current', 'va_temperature', 'temp_set'], 23, 'temperature'),
      x: position.x ?? 50, y: position.y ?? 50
    };
  }));
}

async function allDevices() { return tuyaConfigured ? getTuyaDevices() : store.devices; }

async function controlDevice(id, controls) {
  if (!tuyaConfigured) {
    const updated = store.updateDevice(id, controls);
    if (!updated) throw Object.assign(new Error('Dispositivo não encontrado.'), { status: 404 });
    return updated;
  }
  const functionsResult = await tuya.getFunctions(id);
  const functions = functionsResult?.functions || functionsResult || [];
  const commands = Object.entries(controls).filter(([key]) => ['power', 'brightness', 'temperature'].includes(key)).map(([key, value]) => commandFor(functions, key, value));
  if (commands.length) await tuya.sendCommands(id, commands);
  return (await getTuyaDevices()).find(device => device.id === id);
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if(process.env.TRUST_PROXY==='true')app.set('trust proxy',1);
  app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(requestContext);
  app.use(securityHeaders);
  app.use(requireHttps);
  app.use(metrics.middleware());
  app.use('/api',expressRateLimit({windowMs:60000,limit:Number(process.env.API_RATE_LIMIT_MAX||300)}));
  app.use('/api/v1/auth',expressRateLimit({windowMs:60000,limit:Number(process.env.AUTH_RATE_LIMIT_MAX||20)}));
  app.use(['/api/assistant','/api/devices','/api/scenes','/api/automations'],expressRateLimit({windowMs:60000,limit:120}));
  app.use('/api/v1', createV1Router({ auth, identity, tokens, providers, vault, credentialStore:databasePool?identity:store, turnstile, homeRepository, events, controlExternal:async(device,controls)=>{if(tuyaConfigured&&device.externalId)await controlDevice(device.externalId,controls)} }));

  app.get('/api/health', (_, res) => res.json({ ok: true, uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() }));
  app.get('/api/health/live',(_,res)=>res.json({status:'alive'}));
  app.get('/api/health/ready',async(_,res)=>{const integrations=await providers.health();const degraded=Object.values(integrations).some(item=>item?.status==='unavailable');res.status(degraded?503:200).json({status:degraded?'degraded':'ready',integrations});});
  app.get('/api/metrics',metricsAuthorization,(_,res)=>res.json(metrics.snapshot()));
  app.get('/api/v1/health', (req, res) => res.json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString(), correlationId: req.correlationId }));
  app.get('/api/status', (_, res) => res.json({ mode: tuyaConfigured ? 'tuya' : 'demo', ai: Boolean(process.env.OPENAI_API_KEY), persistence: true, identityStore: databasePool?'postgresql':'memory' }));
  app.use(
    ['/api/events','/api/rooms','/api/devices','/api/scenes','/api/automations','/api/notifications','/api/energy','/api/tuya','/api/assistant'],
    expressRateLimit({windowMs:60000,limit:Number(process.env.API_RATE_LIMIT_MAX||300)}),
    authenticate(tokens,identity),
  );
  app.get('/api/events', (req, res) => events.stream(req, res));
  app.get('/api/rooms', (_, res) => res.json(store.rooms));
  app.get('/api/scenes', (_, res) => res.json(store.scenes));
  app.post('/api/scenes', (req,res)=>{try{res.status(201).json(orchestration.createScene(req.body));}catch(error){res.status(error.status||400).json({error:error.message});}});
  app.patch('/api/scenes/:id',(req,res)=>{const current=store.scenes.find(item=>item.id===req.params.id);if(!current)return res.status(404).json({error:'Cena não encontrada.'});try{res.json(orchestration.createScene({...current,...req.body,id:current.id}));}catch(error){res.status(error.status||400).json({error:error.message});}});
  app.delete('/api/scenes/:id',(req,res)=>res.status(store.deleteScene(req.params.id)?204:404).end());
  app.post('/api/scenes/:id/execute',requireCriticalPin,async(req,res)=>{try{res.json(await orchestration.executeScene(req.params.id,{executionId:req.body?.executionId}));}catch(error){res.status(error.status||500).json({error:error.message});}});
  app.get('/api/automations',(_,res)=>res.json(store.automations));
  app.post('/api/automations',(req,res)=>{try{res.status(201).json(orchestration.createAutomation(req.body));}catch(error){res.status(error.status||400).json({error:error.message});}});
  app.patch('/api/automations/:id',(req,res)=>{const current=store.automations.find(item=>item.id===req.params.id);if(!current)return res.status(404).json({error:'Automação não encontrada.'});const next={...current,...req.body,id:current.id};store.upsertAutomation(next);res.json(next);});
  app.delete('/api/automations/:id',(req,res)=>res.status(store.deleteAutomation(req.params.id)?204:404).end());
  app.post('/api/automations/:id/run',requireCriticalPin,async(req,res)=>{try{res.json(await orchestration.runAutomation(req.params.id,req.body?.executionId));}catch(error){res.status(error.status||500).json({error:error.message});}});
  app.get('/api/notifications',(_,res)=>res.json(store.notifications));
  app.patch('/api/notifications/:id/read',(req,res)=>{const notification=store.readNotification(req.params.id);if(!notification)return res.status(404).json({error:'Notificação não encontrada.'});res.json(notification);});
  app.get('/api/energy',(_,res)=>{const readings=store.energyReadings;const total=readings.length?readings.reduce((sum,item)=>sum+item.kwh,0):null;res.json({configured:readings.length>0,readings,totalKwh:total,estimatedCost:total!==null&&store.energySettings.tariff!==null?total*store.energySettings.tariff:null,settings:store.energySettings});});
  app.post('/api/energy/readings',(req,res)=>{const kwh=Number(req.body?.kwh);if(!Number.isFinite(kwh)||kwh<0)return res.status(400).json({error:'kWh deve ser um número positivo.'});res.status(201).json(store.addEnergyReading({id:crypto.randomUUID(),deviceId:req.body?.deviceId||null,room:req.body?.room||null,kwh,recordedAt:req.body?.recordedAt||new Date().toISOString()}));});
  app.patch('/api/energy/settings',(req,res)=>{const tariff=req.body?.tariff===null?null:Number(req.body?.tariff);if(tariff!==null&&(!Number.isFinite(tariff)||tariff<0))return res.status(400).json({error:'Tarifa inválida.'});res.json(store.updateEnergySettings({tariff}));});
  app.post('/api/rooms', (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (!name || name.length > 40) return res.status(400).json({ error: 'Informe um nome de até 40 caracteres.' });
    if (store.rooms.some(room => room.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: 'Esse cômodo já existe.' });
    res.status(201).json(store.addRoom({ id: crypto.randomUUID(), name }));
  });
  app.patch('/api/rooms/:id', (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (!name || name.length > 40) return res.status(400).json({ error: 'Informe um nome de até 40 caracteres.' });
    if (store.rooms.some(room => room.id !== req.params.id && room.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ error: 'Esse cômodo já existe.' });
    const room = store.renameRoom(req.params.id, name);
    if (!room) return res.status(404).json({ error: 'Cômodo não encontrado.' });
    res.json(room);
  });
  app.put('/api/rooms/order', (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length !== store.rooms.length || new Set(ids).size !== ids.length || ids.some(id => !store.rooms.some(room => room.id === id))) return res.status(400).json({ error: 'Ordem de cômodos inválida.' });
    res.json(store.reorderRooms(ids));
  });
  app.delete('/api/rooms/:id', async (req, res) => {
    const room = store.rooms.find(item => item.id === req.params.id);
    if (!room) return res.status(404).json({ error: 'Cômodo não encontrado.' });
    const devices = await allDevices().catch(() => []);
    if (devices.some(device => device.room === room.name)) return res.status(409).json({ error: 'Mova os dispositivos deste cômodo antes de excluí-lo.' });
    if (store.rooms.length === 1) return res.status(409).json({ error: 'A casa precisa ter pelo menos um cômodo.' });
    store.deleteRoom(req.params.id); res.status(204).end();
  });
  app.get('/api/devices', async (_, res) => { try { res.json(await allDevices()); } catch (error) { res.status(502).json({ error: error.message, provider: 'tuya' }); } });

  app.patch('/api/devices/:id', async (req, res) => {
    try {
      const patch = validateDevicePatch(req.body);
      const { x, y, room, ...controls } = patch;
      if (tuyaConfigured && [x, y, room].some(value => value !== undefined)) store.updateLayout(req.params.id, Object.fromEntries(Object.entries({ x, y, room }).filter(([, value]) => value !== undefined)));
      const updated = tuyaConfigured ? await controlDevice(req.params.id, controls) : store.updateDevice(req.params.id, patch);
      if (!updated) return res.status(404).json({ error: 'Dispositivo não encontrado.' });
      events.publish('device.updated', { deviceId: updated.id, name: updated.name, room: updated.room, online: updated.online, power: updated.power });
      res.json(updated);
    } catch (error) { res.status(error.status || 400).json({ error: error.message }); }
  });

  app.post('/api/devices', (req, res) => {
    if (tuyaConfigured) return res.status(409).json({ error: 'Adicione o aparelho no app Ekaza/Tuya e sincronize novamente.' });
    try {
      const patch = validateDevicePatch(req.body);
      if (!patch.name?.trim() || !patch.room?.trim()) return res.status(400).json({ error: 'Nome e ambiente são obrigatórios.' });
      const created = store.addDevice({ id: crypto.randomUUID(), online: true, power: false, type: 'plug', x: 50, y: 50, ...patch });
      events.publish('device.created', { deviceId: created.id, name: created.name, room: created.room });
      res.status(201).json(created);
    } catch (error) { res.status(400).json({ error: error.message }); }
  });

  app.delete('/api/devices/:id', (req, res) => {
    if (tuyaConfigured) return res.status(409).json({ error: 'Remova aparelhos reais pelo app Ekaza/Tuya.' });
    res.status(store.deleteDevice(req.params.id) ? 204 : 404).end();
  });

  app.post('/api/tuya/test', async (_, res) => {
    if (!tuyaConfigured) return res.status(400).json({ error: 'Preencha as três variáveis TUYA_* no .env.' });
    try { res.json(await tuya.testConnection()); } catch (error) { res.status(502).json({ error: error.message }); }
  });

  app.post('/api/assistant', async (req, res) => {
    const text = String(req.body?.text || '').trim();
    if (!text || text.length > 500) return res.status(400).json({ error: 'Informe um comando de até 500 caracteres.' });
    try {
      const devices = await allDevices();
      const action = await understand(text, devices);
      const targets = devices.filter(device => action.targetIds.includes(device.id));
      if (!targets.length || !Object.keys(action.controls).length) return res.json({ reply: action.reply || 'Não entendi qual aparelho devo controlar. Tente informar o aparelho, ambiente e ação.', changed: [] });
      const changed = await Promise.all(targets.map(device => controlDevice(device.id, action.controls)));
      changed.forEach(device => events.publish('device.updated', { deviceId: device.id, name: device.name, room: device.room, online: device.online, power: device.power, source: 'assistant' }));
      const properties = Object.entries(action.controls).map(([key, value]) => key === 'power' ? (value ? 'ligado' : 'desligado') : key === 'temperature' ? `${value}°C` : `brilho em ${value}%`).join(', ');
      res.json({ reply: action.reply || `${targets.length === 1 ? targets[0].name : `${targets.length} dispositivos`} ${properties}.`, changed });
    } catch (error) { res.status(502).json({ error: error.message }); }
  });

  const dist = path.resolve(__dirname, '../dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
if (process.env.NODE_ENV !== 'test') {const server=app.listen(process.env.PORT || 3001, () => console.log(`Ninho disponível na porta ${process.env.PORT || 3001}`));const shutdown=()=>server.close(async()=>{await databasePool?.end();process.exit(0)});process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);}
