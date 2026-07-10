import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, resilientCall } from '../server/integrations/resilience.js';
import { ProviderRegistry } from '../server/integrations/provider-registry.js';
import { HomeAssistantProvider } from '../server/integrations/home-assistant/home-assistant-provider.js';
import { IntegrationSyncService } from '../server/application/integration-sync-service.js';
import { MemoryDeviceRepository } from '../server/infrastructure/memory-repositories.js';

test('retry recupera falha transitória',async()=>{let attempts=0;const result=await resilientCall(async()=>{attempts+=1;if(attempts<2)throw new Error('temporário');return 'ok'},{retries:2,baseDelayMs:1});assert.equal(result,'ok');assert.equal(attempts,2)});

test('timeout e circuit breaker degradam sem bloquear processo',async()=>{const breaker=new CircuitBreaker({failureThreshold:1,resetTimeoutMs:1000});await assert.rejects(()=>resilientCall(()=>new Promise(()=>{}),{timeoutMs:5,retries:0,breaker}),error=>error.code==='PROVIDER_TIMEOUT');assert.equal(breaker.state,'open');await assert.rejects(()=>resilientCall(async()=>1,{breaker}),error=>error.code==='CIRCUIT_OPEN')});

test('registry isola health check com falha',async()=>{const methods={connect:async()=>{},disconnect:async()=>{},listDevices:async()=>[],getDeviceState:async()=>({}),sendCommand:async()=>({}),subscribeToEvents:async()=>async()=>{},refreshCredentials:async()=>{},healthCheck:async()=>{throw new Error('offline')}};const registry=new ProviderRegistry();registry.register('ha',methods);assert.equal((await registry.health()).ha.status,'down')});

test('Home Assistant normaliza entidades e envia serviço',async()=>{const previous=global.fetch;const calls=[];global.fetch=async(url,options={})=>{calls.push({url,options});if(url.endsWith('/api/states'))return new Response(JSON.stringify([{entity_id:'light.sala',state:'on',attributes:{friendly_name:'Luz Sala'},last_updated:'2026-01-01T00:00:00Z'}]),{status:200});return new Response(JSON.stringify([]),{status:200})};try{const provider=new HomeAssistantProvider({baseUrl:'http://ha:8123',token:'secret'});const devices=await provider.listDevices();assert.equal(devices[0].category,'light');assert.equal(devices[0].name,'Luz Sala');await provider.sendCommand({requestId:'r1',deviceId:'ha:light.sala',capability:'power',value:false});assert.ok(calls.at(-1).url.endsWith('/api/services/light/turn_off'));assert.equal(calls[0].options.headers.Authorization,'Bearer secret')}finally{global.fetch=previous}});

test('sincronização não duplica dispositivo externo',async()=>{const devices=new MemoryDeviceRepository();const provider={listDevices:async()=>[{id:'ha:light.sala',externalId:'light.sala',name:'Sala',category:'light',status:'online',capabilities:[]}]};const service=new IntegrationSyncService({devices});const first=await service.sync({homeId:'home',integrationId:'ha',provider});const second=await service.sync({homeId:'home',integrationId:'ha',provider});assert.deepEqual(first.created,1);assert.deepEqual(second.updated,1);assert.equal((await devices.listByHome('home')).length,1)});
