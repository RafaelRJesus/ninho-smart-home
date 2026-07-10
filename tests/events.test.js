import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../server/core/event-bus.js';

test('EventBus publica envelope e permite cancelar assinatura', () => {
  const bus = new EventBus();
  const received = [];
  const unsubscribe = bus.subscribe(event => received.push(event));
  const event = bus.publish('device.updated', { deviceId: 'lamp-1' });
  unsubscribe();
  bus.publish('device.updated', { deviceId: 'lamp-2' });
  assert.equal(received.length, 1);
  assert.equal(event.type, 'device.updated');
  assert.equal(event.payload.deviceId, 'lamp-1');
  assert.ok(event.id);
  assert.ok(event.occurredAt);
});
