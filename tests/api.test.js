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
after(() => fs.rmSync(dataFile, { force: true }));

test('health e status respondem', async () => {
  const health = await request(app).get('/api/health'); const status = await request(app).get('/api/status');
  assert.equal(health.body.ok, true); assert.equal(status.body.mode, 'demo'); assert.equal(status.body.persistence, true);
});

test('lista, controla e persiste dispositivo', async () => {
  const list = await request(app).get('/api/devices'); const id = list.body[0].id;
  const updated = await request(app).patch(`/api/devices/${id}`).send({ power: false, x: 33 });
  assert.equal(updated.status, 200); assert.equal(updated.body.power, false); assert.equal(updated.body.x, 33); assert.equal(fs.existsSync(dataFile), true);
});

test('assistente controla vários dispositivos', async () => {
  const result = await request(app).post('/api/assistant').send({ text: 'Desligar tudo' });
  assert.equal(result.status, 200); assert.ok(result.body.changed.length >= 2); assert.ok(result.body.changed.every(device => device.power === false));
});

test('valida entrada e cria dispositivo', async () => {
  const invalid = await request(app).post('/api/devices').send({});
  assert.equal(invalid.status, 400);
  const created = await request(app).post('/api/devices').send({ name: 'Luz externa', room: 'Varanda', type: 'light' });
  assert.equal(created.status, 201); assert.equal(created.body.room, 'Varanda');
});

test('cria e reordena cômodos', async () => {
  const created = await request(app).post('/api/rooms').send({ name: 'Varanda' });
  assert.equal(created.status, 201);
  const renamed = await request(app).patch(`/api/rooms/${created.body.id}`).send({ name: 'Varanda gourmet' });
  assert.equal(renamed.status, 200); assert.equal(renamed.body.name, 'Varanda gourmet');
  const rooms = await request(app).get('/api/rooms');
  const ids = rooms.body.map(room => room.id).reverse();
  const reordered = await request(app).put('/api/rooms/order').send({ ids });
  assert.equal(reordered.status, 200);
  assert.equal(reordered.body[0].id, ids[0]);
});

test('cena executa ações e informa resultado total', async () => {
  const devices=await request(app).get('/api/devices');
  const created=await request(app).post('/api/scenes').send({name:'Teste noturno',actions:[{deviceId:devices.body[0].id,controls:{power:false}}]});
  assert.equal(created.status,201);
  const execution=await request(app).post(`/api/scenes/${created.body.id}/execute`).send({executionId:'scene-test-1'});
  assert.equal(execution.status,200);assert.equal(execution.body.status,'succeeded');assert.equal(execution.body.results.length,1);
  const notifications=await request(app).get('/api/notifications');
  assert.equal(notifications.body[0].severity,'success');
});

test('automação registra execução e bloqueia evento duplicado', async () => {
  const scenes=await request(app).get('/api/scenes');
  const created=await request(app).post('/api/automations').send({name:'Automação teste',sceneId:scenes.body[0].id,trigger:{type:'manual'}});
  const first=await request(app).post(`/api/automations/${created.body.id}/run`).send({executionId:'automation-event-1'});
  const duplicate=await request(app).post(`/api/automations/${created.body.id}/run`).send({executionId:'automation-event-1'});
  assert.equal(first.body.status,'succeeded');assert.equal(duplicate.body.status,'duplicate');
  const listed=await request(app).get('/api/automations');
  assert.equal(listed.body[0].lastExecution.status,'duplicate');
});

test('energia ausente não é convertida em zero e tarifa é configurável', async () => {
  const initial=await request(app).get('/api/energy');
  assert.equal(initial.body.totalKwh,null);assert.equal(initial.body.estimatedCost,null);
  await request(app).patch('/api/energy/settings').send({tariff:1.2});
  await request(app).post('/api/energy/readings').send({kwh:2.5,room:'Sala'});
  const measured=await request(app).get('/api/energy');
  assert.equal(measured.body.totalKwh,2.5);assert.equal(measured.body.estimatedCost,3);
});
