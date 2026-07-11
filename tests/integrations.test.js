import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, resilientCall } from '../server/integrations/resilience.js';
import { ProviderRegistry } from '../server/integrations/provider-registry.js';
import { HomeAssistantProvider } from '../server/integrations/home-assistant/home-assistant-provider.js';
import { IntegrationSyncService } from '../server/application/integration-sync-service.js';
import { MemoryDeviceRepository } from '../server/infrastructure/memory-repositories.js';
import { MemoryIdentityStore } from '../server/infrastructure/memory-identity-store.js';
import { MemoryHomeRepository } from '../server/infrastructure/memory-home-repository.js';
import { CredentialVault } from '../server/security/credential-vault.js';
import { EventBus } from '../server/core/event-bus.js';
import { HomeIntegrationService } from '../server/application/home-integration-service.js';
import { createProvider } from '../server/integrations/provider-factory.js';

test('retry recupera falha transitória',async()=>{let attempts=0;const result=await resilientCall(async()=>{attempts+=1;if(attempts<2)throw new Error('temporário');return 'ok'},{retries:2,baseDelayMs:1});assert.equal(result,'ok');assert.equal(attempts,2)});

test('timeout e circuit breaker degradam sem bloquear processo',async()=>{const breaker=new CircuitBreaker({failureThreshold:1,resetTimeoutMs:1000});await assert.rejects(()=>resilientCall(()=>new Promise(()=>{}),{timeoutMs:5,retries:0,breaker}),error=>error.code==='PROVIDER_TIMEOUT');assert.equal(breaker.state,'open');await assert.rejects(()=>resilientCall(async()=>1,{breaker}),error=>error.code==='CIRCUIT_OPEN')});

test('registry isola health check com falha',async()=>{const methods={connect:async()=>{},disconnect:async()=>{},listDevices:async()=>[],getDeviceState:async()=>({}),sendCommand:async()=>({}),subscribeToEvents:async()=>async()=>{},refreshCredentials:async()=>{},healthCheck:async()=>{throw new Error('offline')}};const registry=new ProviderRegistry();registry.register('ha',methods);assert.equal((await registry.health()).ha.status,'down')});

test('Home Assistant normaliza entidades e envia serviço',async()=>{const previous=global.fetch;const calls=[];global.fetch=async(url,options={})=>{calls.push({url,options});if(url.endsWith('/api/states'))return new Response(JSON.stringify([{entity_id:'light.sala',state:'on',attributes:{friendly_name:'Luz Sala'},last_updated:'2026-01-01T00:00:00Z'}]),{status:200});return new Response(JSON.stringify([]),{status:200})};try{const provider=new HomeAssistantProvider({baseUrl:'http://ha:8123',token:'secret'});const devices=await provider.listDevices();assert.equal(devices[0].category,'light');assert.equal(devices[0].name,'Luz Sala');await provider.sendCommand({requestId:'r1',deviceId:'ha:light.sala',capability:'power',value:false});assert.ok(calls.at(-1).url.endsWith('/api/services/light/turn_off'));assert.equal(calls[0].options.headers.Authorization,'Bearer secret')}finally{global.fetch=previous}});

test('sincronização não duplica dispositivo externo',async()=>{const devices=new MemoryDeviceRepository();const provider={listDevices:async()=>[{id:'ha:light.sala',externalId:'light.sala',name:'Sala',category:'light',status:'online',capabilities:[]}]};const service=new IntegrationSyncService({devices});const first=await service.sync({homeId:'home',integrationId:'ha',provider});const second=await service.sync({homeId:'home',integrationId:'ha',provider});assert.deepEqual(first.created,1);assert.deepEqual(second.updated,1);assert.equal((await devices.listByHome('home')).length,1)});

test('cofre residencial sincroniza sem duplicar e persiste eventos externos',async()=>{
  const identity=new MemoryIdentityStore();const repository=new MemoryHomeRepository();const vault=new CredentialVault(Buffer.alloc(32,4).toString('base64'));const events=new EventBus();
  const owner=await identity.createUser({email:'integration@ninho.local',password:'senha-integracao-segura',displayName:'Integração'});const home=await identity.createHome({name:'Casa integrada',ownerId:owner.id});const floor=await identity.createFloor({homeId:home.id,name:'Térreo',position:0});await identity.createRoom({floorId:floor.id,name:'Sala',position:0});
  const sealed=vault.seal({baseUrl:'https://ha.local',token:'token-secreto'},{homeId:home.id,provider:'home-assistant'});await identity.saveIntegrationCredential({homeId:home.id,provider:'home-assistant',sealed,actorId:owner.id});
  let eventHandler;const provider={listDevices:async()=>[{externalId:'light.sala',name:'Luz da sala',category:'light',status:'online',state:{power:false},capabilities:[{code:'power'}]}],healthCheck:async()=>({status:'ok'}),subscribeToEvents:async handler=>{eventHandler=handler;return async()=>{}},sendCommand:async()=>({status:'acknowledged'})};
  const service=new HomeIntegrationService({identity,repository,vault,events,providerFactory:()=>provider});
  const first=await service.sync({homeId:home.id,providerName:'home-assistant',actorId:owner.id,correlationId:'sync-1'});const second=await service.sync({homeId:home.id,providerName:'home-assistant',actorId:owner.id,correlationId:'sync-2'});
  assert.deepEqual({created:first.created,updated:first.updated},{created:1,updated:0});assert.deepEqual({created:second.created,updated:second.updated},{created:0,updated:1});assert.equal((await repository.listDevices(home.id)).length,1);assert.ok((await identity.listIntegrations(home.id))[0].lastSyncAt);
  let published;events.subscribe(event=>published=event);await eventHandler({correlationId:'external-1',externalDeviceId:'light.sala',occurredAt:new Date().toISOString(),state:{state:'on',attributes:{brightness:80}}});const changed=(await repository.listDevices(home.id))[0];assert.equal(changed.power,true);assert.equal(changed.brightness,80);assert.equal(published.type,'device.updated');assert.equal((await identity.listAudit(home.id)).some(item=>item.type==='DEVICE_STATE_RECEIVED'),true);
});

test('factory rejeita credenciais inválidas sem expor segredo',()=>{
  assert.throws(()=>createProvider('tuya',{accessId:'id',accessSecret:'segredo',region:'desconhecida'},'integration'),error=>error.code==='INVALID_INTEGRATION_CREDENTIALS'&&!error.message.includes('segredo'));
  assert.throws(()=>createProvider('home-assistant',{baseUrl:'javascript:alert(1)',token:'segredo'},'integration'),error=>error.code==='INVALID_INTEGRATION_CREDENTIALS');
  assert.throws(()=>createProvider('home-assistant',{baseUrl:'http://192.168.1.10:8123',token:'segredo'},'integration'),error=>error.code==='INVALID_INTEGRATION_CREDENTIALS');
});
