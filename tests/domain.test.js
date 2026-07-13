import test from 'node:test';
import assert from 'node:assert/strict';
import { deviceControls, ensureDeviceControllable, validateDevicePatch } from '../server/domain/device.js';
import { confirmedDevice, deviceStatusLabel, failedDevice, pendingDevice } from '../src/domain/device-command.js';
import { assertDeviceProvider, DEVICE_PROVIDER_METHODS } from '../server/integrations/device-provider.js';

test('domínio filtra campos e valida limites', () => {
  assert.deepEqual(validateDevicePatch({ power: true, secret: 'x' }), { power: true });
  assert.throws(() => validateDevicePatch({ brightness: 101 }), error => error.code === 'VALIDATION_ERROR');
});

test('contrato de integração detecta métodos ausentes', () => {
  const complete = Object.fromEntries(DEVICE_PROVIDER_METHODS.map(method => [method, async () => {}]));
  assert.equal(assertDeviceProvider(complete), complete);
  assert.throws(() => assertDeviceProvider({}), /Métodos ausentes/);
});

test('comando otimista confirma retorno ou restaura estado anterior', () => {
  const original = { id: 'device-1', power: false, online: true, version: 3 };
  const pending = pendingDevice(original, { power: true }, 'request-1');
  assert.equal(pending.power, true); assert.equal(deviceStatusLabel(pending), 'aguardando confirmação');
  const confirmed = confirmedDevice({ ...original, power: true, version: 4 }, 'request-1');
  assert.equal(confirmed.power, true); assert.equal(confirmed.commandStatus, 'succeeded');
  const restored = failedDevice(original, 'request-1', 'Falha segura');
  assert.equal(restored.power, false); assert.equal(deviceStatusLabel(restored), 'erro'); assert.equal(restored.commandError, 'Falha segura');
});

test('domínio bloqueia comandos para offline e erro sem bloquear posicionamento', () => {
  assert.deepEqual(deviceControls({ power: true, x: 20, name: 'Luz' }), { power: true });
  assert.doesNotThrow(() => ensureDeviceControllable({ online: false, status: 'offline' }, {}));
  assert.throws(() => ensureDeviceControllable({ online: false, status: 'offline' }, { power: true }), error => error.code === 'DEVICE_OFFLINE');
  assert.throws(() => ensureDeviceControllable({ online: true, status: 'error' }, { power: true }), error => error.code === 'DEVICE_ERROR');
});
