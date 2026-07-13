import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFloorplanPoint, normalizeZoom, pinchZoom } from '../src/domain/floorplan.js';
import { validateFloorplanContent } from '../server/domain/floorplan.js';

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

test('gesto de pinça amplia e reduz dentro dos limites',()=>{
  assert.equal(pinchZoom(1,100,180),1.8);
  assert.equal(pinchZoom(2,100,300),2.5);
  assert.equal(pinchZoom(1,100,10),.6);
  assert.equal(pinchZoom(1,0,200),1);
});

test('upload aceita imagens e SVG seguro por piso',()=>{
  const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>').toString('base64');
  const value=validateFloorplanContent({floors:{'floor-1':{background:{name:'terreo.svg',mime:'image/svg+xml',dataUrl:`data:image/svg+xml;base64,${svg}`}}}});
  assert.equal(value.floors['floor-1'].background.name,'terreo.svg');
});

test('upload rejeita tipo inválido, excesso e SVG ativo',()=>{
  const dangerous=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString('base64');
  assert.throws(()=>validateFloorplanContent({floors:{floor:{background:{name:'x.svg',mime:'image/svg+xml',dataUrl:`data:image/svg+xml;base64,${dangerous}`}}}}),error=>error.code==='INVALID_FLOORPLAN_UPLOAD');
  assert.throws(()=>validateFloorplanContent({floors:{floor:{background:{name:'x.txt',mime:'text/plain',dataUrl:'data:text/plain;base64,eA=='}}}}),error=>error.code==='INVALID_FLOORPLAN_UPLOAD');
  const oversized=Buffer.alloc(2*1024*1024+1).toString('base64');
  assert.throws(()=>validateFloorplanContent({floors:{floor:{background:{name:'x.png',mime:'image/png',dataUrl:`data:image/png;base64,${oversized}`}}}}),error=>error.code==='INVALID_FLOORPLAN_UPLOAD');
});
