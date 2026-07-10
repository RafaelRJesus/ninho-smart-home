import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceCommandService } from '../server/application/device-command-service.js';
import { MemoryCommandRepository, MemoryDeviceRepository } from '../server/infrastructure/memory-repositories.js';

const device = { id:'device-1', homeId:'home-1', integrationId:'integration-1', externalId:'external-1', name:'Luz', category:'light', status:'online', capabilities:[{ code:'power', writable:true }] };

test('serviço de comando é idempotente por requestId', async () => {
  const devices = new MemoryDeviceRepository([device]); const commands = new MemoryCommandRepository(); let calls=0;
  const providers = new Map([['integration-1',{ sendCommand:async command=>{calls+=1;return {requestId:command.requestId,status:'succeeded',acceptedAt:new Date().toISOString()}} }]]);
  const service = new DeviceCommandService({ devices, commands, providers });
  const command = { requestId:'request-1',homeId:'home-1',deviceId:'device-1',capability:'power',value:true,requestedBy:'user-1' };
  await service.execute(command); await service.execute(command);
  assert.equal(calls,1);
});

test('serviço bloqueia dispositivo offline e capacidade ausente', async () => {
  const providers = new Map();
  const offline = new DeviceCommandService({devices:new MemoryDeviceRepository([{...device,status:'offline'}]),commands:new MemoryCommandRepository(),providers});
  await assert.rejects(()=>offline.execute({requestId:'r1',homeId:'home-1',deviceId:'device-1',capability:'power'}),error=>error.code==='DEVICE_OFFLINE');
  const unsupported = new DeviceCommandService({devices:new MemoryDeviceRepository([device]),commands:new MemoryCommandRepository(),providers});
  await assert.rejects(()=>unsupported.execute({requestId:'r2',homeId:'home-1',deviceId:'device-1',capability:'color'}),error=>error.code==='CAPABILITY_NOT_SUPPORTED');
});
