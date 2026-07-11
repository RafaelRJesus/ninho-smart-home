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
