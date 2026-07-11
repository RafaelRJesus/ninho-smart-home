import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';

const dataFile = path.resolve('data/test-state.json');
process.env.DATA_FILE = dataFile;
process.env.NODE_ENV = 'test';
process.env.TUYA_ACCESS_ID = '';
process.env.TUYA_ACCESS_SECRET = '';

const { app } = await import('../server/index.js');
const agent=request.agent(app);
const registration=await agent.post('/api/v1/auth/register').send({email:'api-tests@ninho.local',password:'senha-de-teste-segura',displayName:'Teste API'});
after(() => fs.rmSync(dataFile, { force: true }));

test('health e status respondem', async () => {
  const health = await request(app).get('/api/health'); const status = await request(app).get('/api/status');
  assert.equal(health.body.ok, true); assert.equal(status.body.mode, 'demo'); assert.equal(status.body.persistence, true);
});

test('sessão usa cookies HttpOnly e não devolve token ao JavaScript',()=>{assert.equal(registration.body.accessToken,undefined);const cookies=registration.headers['set-cookie'];assert.ok(cookies.some(value=>value.startsWith('ninho_access=')&&value.includes('HttpOnly')));assert.ok(cookies.some(value=>value.startsWith('ninho_refresh=')&&value.includes('HttpOnly')));});

test('APIs residenciais recusam acesso sem sessão',async()=>{const response=await request(app).get('/api/devices');assert.equal(response.status,401);assert.equal(response.body.code,'AUTHENTICATION_REQUIRED');});

test('cofre persiste apenas credencial cifrada e respeita RBAC',async()=>{const home=await agent.post('/api/v1/homes').send({name:'Casa do cofre'});const saved=await agent.put(`/api/v1/homes/${home.body.id}/integrations/tuya/credentials`).send({credentials:{accessId:'id-confidencial',accessSecret:'segredo-que-nao-pode-vazar',region:'us'}});assert.equal(saved.status,200);assert.equal(saved.body.provider,'tuya');assert.equal(saved.body.accessSecret,undefined);const disk=fs.readFileSync(dataFile,'utf8');assert.equal(disk.includes('segredo-que-nao-pode-vazar'),false);assert.equal(disk.includes('id-confidencial'),false);const listed=await agent.get(`/api/v1/homes/${home.body.id}/integrations`);assert.equal(listed.body[0].status,'configured');});

test('lista, controla e persiste dispositivo', async () => {
  const list = await agent.get('/api/devices'); const id = list.body[0].id;
  const updated = await agent.patch(`/api/devices/${id}`).send({ power: false, x: 33 });
  assert.equal(updated.status, 200); assert.equal(updated.body.power, false); assert.equal(updated.body.x, 33); assert.equal(fs.existsSync(dataFile), true);
});

test('assistente controla vários dispositivos', async () => {
  const result = await agent.post('/api/assistant').send({ text: 'Desligar tudo' });
  assert.equal(result.status, 200); assert.ok(result.body.changed.length >= 2); assert.ok(result.body.changed.every(device => device.power === false));
});

test('valida entrada e cria dispositivo', async () => {
  const invalid = await agent.post('/api/devices').send({});
  assert.equal(invalid.status, 400);
  const created = await agent.post('/api/devices').send({ name: 'Luz externa', room: 'Varanda', type: 'light' });
  assert.equal(created.status, 201); assert.equal(created.body.room, 'Varanda');
});

test('cria e reordena cômodos', async () => {
  const created = await agent.post('/api/rooms').send({ name: 'Varanda' });
  assert.equal(created.status, 201);
  const renamed = await agent.patch(`/api/rooms/${created.body.id}`).send({ name: 'Varanda gourmet' });
  assert.equal(renamed.status, 200); assert.equal(renamed.body.name, 'Varanda gourmet');
  const rooms = await agent.get('/api/rooms');
  const ids = rooms.body.map(room => room.id).reverse();
  const reordered = await agent.put('/api/rooms/order').send({ ids });
  assert.equal(reordered.status, 200);
  assert.equal(reordered.body[0].id, ids[0]);
});

test('cena executa ações e informa resultado total', async () => {
  const devices=await agent.get('/api/devices');
  const created=await agent.post('/api/scenes').send({name:'Teste noturno',actions:[{deviceId:devices.body[0].id,controls:{power:false}}]});
  assert.equal(created.status,201);
  const execution=await agent.post(`/api/scenes/${created.body.id}/execute`).send({executionId:'scene-test-1'});
  assert.equal(execution.status,200);assert.equal(execution.body.status,'succeeded');assert.equal(execution.body.results.length,1);
  const notifications=await agent.get('/api/notifications');
  assert.equal(notifications.body[0].severity,'success');
});

test('automação registra execução e bloqueia evento duplicado', async () => {
  const scenes=await agent.get('/api/scenes');
  const created=await agent.post('/api/automations').send({name:'Automação teste',sceneId:scenes.body[0].id,trigger:{type:'manual'}});
  const first=await agent.post(`/api/automations/${created.body.id}/run`).send({executionId:'automation-event-1'});
  const duplicate=await agent.post(`/api/automations/${created.body.id}/run`).send({executionId:'automation-event-1'});
  assert.equal(first.body.status,'succeeded');assert.equal(duplicate.body.status,'duplicate');
  const listed=await agent.get('/api/automations');
  assert.equal(listed.body[0].lastExecution.status,'duplicate');
});

test('energia ausente não é convertida em zero e tarifa é configurável', async () => {
  const initial=await agent.get('/api/energy');
  assert.equal(initial.body.totalKwh,null);assert.equal(initial.body.estimatedCost,null);
  await agent.patch('/api/energy/settings').send({tariff:1.2});
  await agent.post('/api/energy/readings').send({kwh:2.5,room:'Sala'});
  const measured=await agent.get('/api/energy');
  assert.equal(measured.body.totalKwh,2.5);assert.equal(measured.body.estimatedCost,3);
});
