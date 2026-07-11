import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV='test';
process.env.TUYA_ACCESS_ID='';
process.env.TUYA_ACCESS_SECRET='';
const {app}=await import('../server/index.js');

async function household(email,name){
  const agent=request.agent(app);
  const registration=await agent.post('/api/v1/auth/register').send({email,password:'senha-residencial-segura',displayName:name});
  assert.equal(registration.status,201);
  const created=await agent.post('/api/v1/homes').send({name:`Casa ${name}`});
  assert.equal(created.status,201);
  return {agent,home:created.body};
}

test('domínio v1 persiste recursos sob a residência autorizada',async()=>{
  const {agent,home}=await household('domain-owner@ninho.local','Domínio');
  const rooms=await agent.get(`/api/v1/homes/${home.id}/rooms`);
  assert.equal(rooms.status,200);assert.equal(rooms.body.length,4);
  const device=await agent.post(`/api/v1/homes/${home.id}/devices`).send({name:'Luz de teste',room:rooms.body[0].name,type:'light',power:false,x:30,y:40});
  assert.equal(device.status,201);assert.equal(device.body.roomId,rooms.body[0].id);
  const changed=await agent.patch(`/api/v1/homes/${home.id}/devices/${device.body.id}`).send({power:true,brightness:65});
  assert.equal(changed.status,200);assert.equal(changed.body.power,true);assert.equal(changed.body.brightness,65);
  const scene=await agent.post(`/api/v1/homes/${home.id}/scenes`).send({name:'Cena segura',actions:[{deviceId:device.body.id,controls:{power:false}}]});
  assert.equal(scene.status,201);
  const execution=await agent.post(`/api/v1/homes/${home.id}/scenes/${scene.body.id}/execute`).send({executionId:'2c82e708-c66b-49e4-a67e-c3d176d10f51'});
  assert.equal(execution.status,200);assert.equal(execution.body.status,'succeeded');
  const notifications=await agent.get(`/api/v1/homes/${home.id}/notifications`);
  assert.equal(notifications.body.length,1);
  const energy=await agent.get(`/api/v1/homes/${home.id}/energy`);
  assert.equal(energy.body.totalKwh,null);
});

test('RBAC impede acesso cruzado e não vaza recursos entre residências',async()=>{
  const owner=await household('segregation-owner@ninho.local','Owner');
  const stranger=await household('segregation-stranger@ninho.local','Stranger');
  const room=(await owner.agent.get(`/api/v1/homes/${owner.home.id}/rooms`)).body[0];
  await owner.agent.post(`/api/v1/homes/${owner.home.id}/devices`).send({name:'Dispositivo privado',room:room.name,type:'plug'});
  const forbidden=await stranger.agent.get(`/api/v1/homes/${owner.home.id}/devices`);
  assert.equal(forbidden.status,403);assert.equal(forbidden.body.code,'FORBIDDEN');
  const ownDevices=await stranger.agent.get(`/api/v1/homes/${stranger.home.id}/devices`);
  assert.equal(ownDevices.status,200);assert.deepEqual(ownDevices.body,[]);
});

test('entradas inválidas e recurso de outra casa são rejeitados',async()=>{
  const first=await household('negative-first@ninho.local','Primeira');
  const second=await household('negative-second@ninho.local','Segunda');
  const invalid=await first.agent.post(`/api/v1/homes/${first.home.id}/devices`).send({name:'Sem ambiente',room:'Inexistente',type:'plug'});
  assert.equal(invalid.status,400);assert.equal(invalid.body.code,'VALIDATION_ERROR');
  const otherRoom=(await second.agent.get(`/api/v1/homes/${second.home.id}/rooms`)).body[0];
  const crossRoom=await first.agent.post(`/api/v1/homes/${first.home.id}/devices`).send({name:'Tentativa cruzada',roomId:otherRoom.id,room:'Inexistente',type:'plug'});
  assert.equal(crossRoom.status,400);
});

test('CRUD versionado da estrutura audita alterações e rejeita versões antigas',async()=>{
  const {agent,home}=await household('structure-owner@ninho.local','Estrutura');
  const renamedHome=await agent.patch(`/api/v1/homes/${home.id}`).send({name:'Casa versionada',version:home.version});
  assert.equal(renamedHome.status,200);assert.equal(renamedHome.body.version,2);
  const staleHome=await agent.patch(`/api/v1/homes/${home.id}`).send({name:'Sobrescrita',version:home.version});
  assert.equal(staleHome.status,409);assert.equal(staleHome.body.code,'VERSION_CONFLICT');

  const floor=await agent.post(`/api/v1/homes/${home.id}/floors`).send({name:'Superior'});
  assert.equal(floor.status,201);assert.equal(floor.body.version,1);
  const renamedFloor=await agent.patch(`/api/v1/homes/${home.id}/floors/${floor.body.id}`).send({name:'Primeiro andar',version:floor.body.version});
  assert.equal(renamedFloor.status,200);assert.equal(renamedFloor.body.version,2);
  const room=await agent.post(`/api/v1/homes/${home.id}/rooms`).send({name:'Escritório',floorId:floor.body.id});
  assert.equal(room.status,201);assert.equal(room.body.floorId,floor.body.id);
  const renamedRoom=await agent.patch(`/api/v1/homes/${home.id}/rooms/${room.body.id}`).send({name:'Home office',version:room.body.version});
  assert.equal(renamedRoom.status,200);assert.equal(renamedRoom.body.version,2);

  const device=await agent.post(`/api/v1/homes/${home.id}/devices`).send({name:'Luminária',roomId:room.body.id,type:'light',externalId:'structure-light-1'});
  assert.equal(device.status,201);assert.equal(device.body.version,1);
  const duplicate=await agent.post(`/api/v1/homes/${home.id}/devices`).send({name:'Duplicado',roomId:room.body.id,type:'light',externalId:'structure-light-1'});
  assert.equal(duplicate.status,409);assert.equal(duplicate.body.code,'DEVICE_ALREADY_EXISTS');
  const moved=await agent.patch(`/api/v1/homes/${home.id}/devices/${device.body.id}`).send({name:'Luminária de mesa',version:device.body.version});
  assert.equal(moved.status,200);assert.equal(moved.body.version,2);
  const staleDevice=await agent.patch(`/api/v1/homes/${home.id}/devices/${device.body.id}`).send({name:'Versão antiga',version:device.body.version});
  assert.equal(staleDevice.status,409);assert.equal(staleDevice.body.code,'VERSION_CONFLICT');

  const audit=await agent.get(`/api/v1/homes/${home.id}/audit`);
  assert.equal(audit.status,200);
  for(const type of ['HOME_UPDATED','FLOOR_UPDATED','ROOM_CREATED','ROOM_UPDATED','DEVICE_CREATED','DEVICE_UPDATED'])assert.ok(audit.body.some(item=>item.type===type),type);
});

test('exclusões estruturais protegem dependências e exigem versão atual',async()=>{
  const {agent,home}=await household('deletion-owner@ninho.local','Exclusão');
  const floor=await agent.post(`/api/v1/homes/${home.id}/floors`).send({name:'Anexo'});
  const room=await agent.post(`/api/v1/homes/${home.id}/rooms`).send({name:'Oficina',floorId:floor.body.id});
  const blockedFloor=await agent.delete(`/api/v1/homes/${home.id}/floors/${floor.body.id}?version=${floor.body.version}`);
  assert.equal(blockedFloor.status,409);assert.equal(blockedFloor.body.code,'FLOOR_NOT_EMPTY');
  const device=await agent.post(`/api/v1/homes/${home.id}/devices`).send({name:'Tomada',roomId:room.body.id,type:'plug'});
  const blockedRoom=await agent.delete(`/api/v1/homes/${home.id}/rooms/${room.body.id}?version=${room.body.version}`);
  assert.equal(blockedRoom.status,409);assert.equal(blockedRoom.body.code,'ROOM_NOT_EMPTY');
  assert.equal((await agent.delete(`/api/v1/homes/${home.id}/devices/${device.body.id}?version=${device.body.version}`)).status,204);
  assert.equal((await agent.delete(`/api/v1/homes/${home.id}/rooms/${room.body.id}?version=${room.body.version}`)).status,204);
  assert.equal((await agent.delete(`/api/v1/homes/${home.id}/floors/${floor.body.id}?version=${floor.body.version}`)).status,204);
});
