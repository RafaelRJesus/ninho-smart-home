import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFloorplanPoint, normalizeZoom } from '../src/domain/floorplan.js';

test('coordenadas da planta compensam zoom e pan', () => {
  const point = normalizeFloorplanPoint({ clientX: 250, clientY: 150, rect: { left: 0, top: 0, width: 400, height: 200 }, pan: { x: 50, y: 50 }, zoom: 2 });
  assert.deepEqual(point, { x: 25, y: 25 });
});

test('coordenadas e zoom respeitam limites seguros', () => {
  const point = normalizeFloorplanPoint({ clientX: -100, clientY: 900, rect: { left: 0, top: 0, width: 400, height: 200 }, pan: { x: 0, y: 0 }, zoom: 1 });
  assert.deepEqual(point, { x: 2, y: 97 });
  assert.equal(normalizeZoom(.1), .6);
  assert.equal(normalizeZoom(9), 2.5);
});
