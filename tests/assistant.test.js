import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLocally } from '../server/assistant.js';

const devices = [
  { id: 'a', name: 'Luz principal', room: 'Sala', type: 'light' },
  { id: 'b', name: 'Abajur', room: 'Quarto', type: 'light' },
  { id: 'c', name: 'Ar-condicionado', room: 'Sala', type: 'ac' }
];

test('interpreta ligar luz por ambiente', () => {
  assert.deepEqual(parseLocally('Acenda a luz da sala', devices), { targetIds: ['a'], controls: { power: true }, understood: true });
});

test('interpreta desligar todos os dispositivos', () => {
  const result = parseLocally('Desligar tudo', devices);
  assert.deepEqual(result.targetIds, ['a', 'b', 'c']);
  assert.deepEqual(result.controls, { power: false });
});

test('interpreta temperatura e brilho', () => {
  assert.equal(parseLocally('Coloque o ar da sala em 22 graus', devices).controls.temperature, 22);
  assert.equal(parseLocally('Luz da sala com brilho em 35', devices).controls.brightness, 35);
});
