import crypto from 'node:crypto';
import { inferType, statusValue, commandFor } from '../../tuya-client.js';

const powerCodes=['switch_led','switch_1','switch','switch_power','power'];
const capabilities=functions=>functions.map(item=>({code:item.code,type:'string',readable:true,writable:true,providerDefinition:item.values}));

export class TuyaProvider {
  constructor({client,integrationId='tuya'}){this.client=client;this.integrationId=integrationId;}
  async connect(){await this.client.ensureToken();}
  async disconnect(){this.client.token=null;this.client.expiresAt=0;}
  async listDevices(){const cloud=await this.client.listDevices();return Promise.all(cloud.map(async item=>{const [status,functionsResult]=await Promise.all([this.client.getStatus(item.id).catch(()=>[]),this.client.getFunctions(item.id).catch(()=>({functions:[]}))]);const functions=functionsResult?.functions||functionsResult||[];return {id:`tuya:${item.id}`,externalId:item.id,integrationId:this.integrationId,name:item.name||item.customName||'Dispositivo Tuya',category:inferType(item.category,functions),status:item.isOnline===false||item.online===false?'offline':'online',capabilities:capabilities(functions),state:{power:Boolean(statusValue(status,powerCodes,false))},updatedAt:new Date().toISOString()}}));}
  async getDeviceState(deviceId){const status=await this.client.getStatus(deviceId.replace(/^tuya:/,''));return Object.fromEntries(status.map(item=>[item.code,item.value]));}
  async sendCommand(command){const externalId=command.externalId||command.deviceId.replace(/^tuya:/,'');const result=await this.client.getFunctions(externalId);const functions=result?.functions||result||[];await this.client.sendCommands(externalId,[commandFor(functions,command.capability,command.value)]);return {requestId:command.requestId,status:'acknowledged',acceptedAt:new Date().toISOString()};}
  async subscribeToEvents(handler){let stopped=false;let snapshot=new Map();const poll=async()=>{if(stopped)return;const devices=await this.listDevices();for(const device of devices){const serialized=JSON.stringify(device.state);if(snapshot.has(device.externalId)&&snapshot.get(device.externalId)!==serialized)await handler({correlationId:crypto.randomUUID(),externalDeviceId:device.externalId,occurredAt:new Date().toISOString(),state:device.state});snapshot.set(device.externalId,serialized)}};await poll();const timer=setInterval(()=>poll().catch(()=>{}),Number(process.env.TUYA_POLL_INTERVAL_MS)||15000);return async()=>{stopped=true;clearInterval(timer)};}
  async refreshCredentials(){this.client.token=null;await this.client.ensureToken();}
  async healthCheck(){const started=Date.now();const result=await this.client.testConnection();return {status:'ok',latencyMs:Date.now()-started,details:{deviceCount:result.deviceCount}};}
}
