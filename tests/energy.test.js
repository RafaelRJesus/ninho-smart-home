import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateEnergy, validateEnergyAlert, validateNotificationPreferences } from '../server/domain/energy.js';

test('energia agrega por dia, mês, cômodo e dispositivo sem transformar ausência em zero',()=>{
  assert.equal(aggregateEnergy([],1).totalKwh,null);
  const value=aggregateEnergy([{kwh:1.25,recordedAt:'2026-07-01T10:00:00Z',roomId:'sala',deviceId:'ar'},{kwh:2,recordedAt:'2026-07-02T10:00:00Z',roomId:'sala',deviceId:'tv'}],0.9);
  assert.equal(value.totalKwh,3.25);assert.equal(value.estimatedCost,2.925);assert.deepEqual(value.daily.map(item=>item.kwh),[1.25,2]);assert.equal(value.monthly[0].kwh,3.25);assert.equal(value.byRoom[0].kwh,3.25);assert.equal(value.byDevice.length,2);
});
test('preferências exigem um canal e validam horário silencioso',()=>{assert.throws(()=>validateNotificationPreferences({channels:{internal:false}}));assert.deepEqual(validateNotificationPreferences({channels:{push:true},quietHours:{enabled:true,start:'23:00',end:'06:30'}}).channels,{internal:true,push:true,email:false});assert.throws(()=>validateNotificationPreferences({channels:{internal:true},quietHours:{start:'25:00'}}));});
test('alerta exige período e limite positivo',()=>{assert.equal(validateEnergyAlert({period:'daily',thresholdKwh:10}).thresholdKwh,10);assert.throws(()=>validateEnergyAlert({period:'weekly',thresholdKwh:0}));});
