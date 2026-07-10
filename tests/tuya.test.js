import test from 'node:test';
import assert from 'node:assert/strict';
import { commandFor, inferType, normalizedStatusValue, statusValue, TuyaClient } from '../server/tuya-client.js';

test('assinatura Tuya é HMAC-SHA256 em maiúsculas', () => {
  const client = new TuyaClient({ accessId: 'id', accessSecret: 'secret', region: 'us' });
  assert.match(client.sign('payload'), /^[A-F0-9]{64}$/);
  assert.equal(client.host, 'https://openapi.tuyaus.com');
});

test('mapeia funções e escalas do aparelho', () => {
  const functions = [{ code: 'switch_led', values: '{}' }, { code: 'bright_value_v2', values: '{"min":10,"max":1000}' }];
  assert.deepEqual(commandFor(functions, 'power', true), { code: 'switch_led', value: true });
  assert.deepEqual(commandFor(functions, 'brightness', 50), { code: 'bright_value_v2', value: 505 });
  assert.equal(inferType('dj', functions), 'light');
  assert.equal(statusValue([{ code: 'switch_led', value: true }], ['switch_led'], false), true);
  assert.equal(normalizedStatusValue([{code:'bright_value_v2',value:1000}],functions,['bright_value_v2'],50,'brightness'),100);
  assert.equal(normalizedStatusValue([{code:'bright_value_v2',value:505}],functions,['bright_value_v2'],50,'brightness'),50);
});

test('normaliza escala de temperatura recebida da Tuya',()=>{
  const functions=[{code:'temp_current',values:'{"scale":1}'}];
  assert.equal(normalizedStatusValue([{code:'temp_current',value:235}],functions,['temp_current'],null,'temperature'),23.5);
});

test('rejeita controle não suportado pelo aparelho', () => {
  assert.throws(() => commandFor([], 'power', true), /não oferece/);
});
