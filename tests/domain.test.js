import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDevicePatch } from '../server/domain/device.js';
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
