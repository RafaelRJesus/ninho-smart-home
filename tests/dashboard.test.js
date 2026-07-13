import test from 'node:test';
import assert from 'node:assert/strict';
import {DashboardService} from '../server/application/dashboard-service.js';
import {MemoryHomeRepository} from '../server/infrastructure/memory-home-repository.js';
import {MemoryIdentityStore} from '../server/infrastructure/memory-identity-store.js';

test('dashboard agrega indicadores operacionais sem confundir ausência com zero',async()=>{
  const identity=new MemoryIdentityStore();const repository=new MemoryHomeRepository();const homeId='dashboard-home';
  await repository.saveDevice(homeId,{id:'light-1',externalId:'light-1',name:'Luz da sala',type:'light',room:'Sala',online:true,power:true});
  await repository.saveDevice(homeId,{id:'camera-1',externalId:'camera-1',name:'Câmera',type:'camera',room:'Entrada',online:false});
  await identity.record({type:'DEVICE_CREATED',homeId,targetId:'light-1',result:'succeeded'});
  const dashboard=await new DashboardService({identity,repository,startedAt:'2026-07-13T10:00:00.000Z',version:'test'}).get(homeId);
  assert.deepEqual(dashboard.devices,{total:2,online:1,offline:1,active:1});
  assert.equal(dashboard.cameras.total,1);assert.equal(dashboard.cameras.online,0);
  assert.equal(dashboard.energy.configured,false);assert.equal(dashboard.energy.totalKwh,null);
  assert.equal(dashboard.climate.configured,false);assert.equal(dashboard.system.version,'test');
  assert.equal(dashboard.activity[0].type,'DEVICE_CREATED');
});

test('dashboard sinaliza alertas críticos, integração degradada e calcula energia',async()=>{
  const identity=new MemoryIdentityStore();const repository=new MemoryHomeRepository();const homeId='attention-home';
  await repository.addNotification(homeId,{severity:'error',title:'Alerta',message:'Falha'});
  await repository.addEnergyReading(homeId,{kwh:2.5,recordedAt:'2026-07-13T10:00:00.000Z'});
  await repository.updateEnergySettings(homeId,{tariff:1,currency:'BRL'});
  await identity.saveIntegrationCredential({homeId,provider:'tuya',sealed:{keyVersion:'v1'},actorId:'owner'});
  const dashboard=await new DashboardService({identity,repository}).get(homeId);
  assert.equal(dashboard.security.status,'attention');assert.equal(dashboard.internet.status,'degraded');
  assert.equal(dashboard.energy.totalKwh,2.5);assert.equal(dashboard.energy.estimatedCost,2.5);
});
