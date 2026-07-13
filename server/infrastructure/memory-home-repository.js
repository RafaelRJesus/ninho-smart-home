import crypto from 'node:crypto';

const clone=value=>structuredClone(value);
const initial=()=>({devices:[],floorplan:{content:{floors:{}},version:1,updatedAt:new Date().toISOString()},floorplanVersions:[],scenes:[],automations:[],notifications:[],energyReadings:[],energySettings:{tariff:null,currency:'BRL'}});

export class MemoryHomeRepository {
  constructor(){this.homes=new Map();}
  state(homeId){if(!this.homes.has(homeId))this.homes.set(homeId,initial());return this.homes.get(homeId);}
  async listDevices(homeId){return clone(this.state(homeId).devices);}
  async findDevice(homeId,id){const value=this.state(homeId).devices.find(item=>item.id===id);return value?clone(value):null;}
  async findDeviceByExternalId(homeId,integrationId,externalId){const value=this.state(homeId).devices.find(item=>item.integrationId===integrationId&&item.externalId===externalId);return value?clone(value):null;}
  async saveDevice(homeId,input){const state=this.state(homeId);const current=state.devices.find(item=>item.id===input.id);const externalId=input.externalId||input.id||crypto.randomUUID();if(state.devices.some(item=>item.id!==input.id&&item.externalId===externalId))return false;const status=input.status||(input.online===false?'offline':'online');const device={id:input.id||crypto.randomUUID(),name:input.name,type:input.type||'plug',roomId:input.roomId||null,room:input.room||'Sem ambiente',status,error:status==='error',online:status==='online'&&input.online!==false,power:Boolean(input.power),brightness:input.brightness,temperature:input.temperature,color:input.color,volume:input.volume,mediaAction:input.mediaAction,locked:input.locked,position:input.position,cameraAction:input.cameraAction,capabilities:clone(input.capabilities||[]),x:input.x??50,y:input.y??50,externalId,integrationId:input.integrationId||null,version:current?.version||1};if(current)Object.assign(current,device);else state.devices.push(device);return clone(current||device);}
  async updateDevice(homeId,id,patch){const current=this.state(homeId).devices.find(item=>item.id===id);if(!current)return null;if(patch.version!==undefined&&current.version!==patch.version)return false;const next={...patch};if(patch.status!==undefined||patch.online!==undefined){next.status=patch.status||(patch.online?'online':'offline');next.error=next.status==='error';next.online=next.status==='online'&&patch.online!==false;}Object.assign(current,next,{version:current.version+1});return clone(current);}
  async deleteDevice(homeId,id,version){const state=this.state(homeId);const index=state.devices.findIndex(item=>item.id===id);if(index<0)return null;if(version!==undefined&&state.devices[index].version!==version)return false;state.devices.splice(index,1);return true;}
  async getFloorplan(homeId){return clone(this.state(homeId).floorplan);}
  async saveFloorplan(homeId,content,expectedVersion){const state=this.state(homeId);const floorplan=state.floorplan;if(expectedVersion!==undefined&&floorplan.version!==expectedVersion)return false;state.floorplanVersions.unshift({version:floorplan.version,content:clone(floorplan.content),createdAt:floorplan.updatedAt});floorplan.content=clone(content);floorplan.version+=1;floorplan.updatedAt=new Date().toISOString();return clone(floorplan);}
  async listFloorplanVersions(homeId){const state=this.state(homeId);return clone([{version:state.floorplan.version,content:state.floorplan.content,createdAt:state.floorplan.updatedAt},...state.floorplanVersions]);}
  async restoreFloorplan(homeId,targetVersion,expectedVersion){const state=this.state(homeId);if(state.floorplan.version!==expectedVersion)return false;const target=(await this.listFloorplanVersions(homeId)).find(item=>item.version===targetVersion);if(!target)return null;return this.saveFloorplan(homeId,target.content,expectedVersion);}
  async listScenes(homeId){return clone(this.state(homeId).scenes);}
  async saveScene(homeId,input){const state=this.state(homeId);const current=state.scenes.find(item=>item.id===input.id);const scene={...input,id:input.id||crypto.randomUUID(),homeId,updatedAt:new Date().toISOString(),createdAt:current?.createdAt||new Date().toISOString()};if(current)Object.assign(current,scene);else state.scenes.push(scene);return clone(current||scene);}
  async deleteScene(homeId,id){const state=this.state(homeId);const index=state.scenes.findIndex(item=>item.id===id);if(index<0)return false;state.scenes.splice(index,1);return true;}
  async listAutomations(homeId){return clone(this.state(homeId).automations);}
  async saveAutomation(homeId,input){const state=this.state(homeId);const current=state.automations.find(item=>item.id===input.id);const automation={...input,id:input.id||crypto.randomUUID(),homeId,createdAt:current?.createdAt||new Date().toISOString()};if(current)Object.assign(current,automation);else state.automations.push(automation);return clone(current||automation);}
  async deleteAutomation(homeId,id){const state=this.state(homeId);const index=state.automations.findIndex(item=>item.id===id);if(index<0)return false;state.automations.splice(index,1);return true;}
  async listNotifications(homeId){return clone(this.state(homeId).notifications);}
  async addNotification(homeId,input){const value={id:input.id||crypto.randomUUID(),homeId,readAt:null,createdAt:new Date().toISOString(),...input};this.state(homeId).notifications.unshift(value);return clone(value);}
  async readNotification(homeId,id){const value=this.state(homeId).notifications.find(item=>item.id===id);if(!value)return null;value.readAt=new Date().toISOString();return clone(value);}
  async getEnergy(homeId){const state=this.state(homeId);return {readings:clone(state.energyReadings),settings:clone(state.energySettings)};}
  async addEnergyReading(homeId,input){const value={id:crypto.randomUUID(),homeId,recordedAt:new Date().toISOString(),...input};this.state(homeId).energyReadings.push(value);return clone(value);}
  async updateEnergySettings(homeId,input){Object.assign(this.state(homeId).energySettings,input);return clone(this.state(homeId).energySettings);}
}
