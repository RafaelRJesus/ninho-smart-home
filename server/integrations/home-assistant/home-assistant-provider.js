import crypto from 'node:crypto';
import { AppError } from '../../core/app-error.js';

const writableDomains=new Set(['light','switch','climate','media_player','lock','cover','fan','vacuum','button','input_boolean']);
const category=domain=>({light:'light',switch:'plug',climate:'ac',media_player:'tv',camera:'camera',lock:'lock',cover:'cover',binary_sensor:'sensor',sensor:'sensor'}[domain]||'other');

export class HomeAssistantProvider {
  constructor({baseUrl,token,integrationId='home-assistant',webSocketFactory}){this.baseUrl=String(baseUrl||'').replace(/\/$/,'');this.token=token;this.integrationId=integrationId;this.webSocketFactory=webSocketFactory||(url=>new WebSocket(url));}
  headers(){return {Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'};}
  async request(path,options={}){const response=await fetch(`${this.baseUrl}${path}`,{...options,headers:{...this.headers(),...options.headers}});const text=await response.text();let data;try{data=text?JSON.parse(text):null}catch{data=text}if(!response.ok)throw new AppError('HOME_ASSISTANT_ERROR',`Home Assistant respondeu ${response.status}.`,502);return data;}
  async connect(){await this.request('/api/');}
  async disconnect(){}
  async listDevices(){const states=await this.request('/api/states');return states.map(item=>{const [domain]=item.entity_id.split('.');return {id:`ha:${item.entity_id}`,externalId:item.entity_id,integrationId:this.integrationId,name:item.attributes?.friendly_name||item.entity_id,category:category(domain),status:['unavailable','unknown'].includes(item.state)?'offline':'online',capabilities:[{code:'power',type:'boolean',readable:true,writable:writableDomains.has(domain)}],state:{value:item.state,...item.attributes},updatedAt:item.last_updated||new Date().toISOString()}});}
  async getDeviceState(deviceId){return this.request(`/api/states/${deviceId.replace(/^ha:/,'')}`);}
  async sendCommand(command){const entityId=command.externalId||command.deviceId.replace(/^ha:/,'');const domain=entityId.split('.')[0];let service;if(command.capability==='power')service=command.value?'turn_on':'turn_off';else service=command.capability;await this.request(`/api/services/${domain}/${service}`,{method:'POST',body:JSON.stringify({entity_id:entityId,...command.serviceData})});return {requestId:command.requestId,status:'acknowledged',acceptedAt:new Date().toISOString()};}
  async subscribeToEvents(handler){const wsUrl=this.baseUrl.replace(/^http/,'ws')+'/api/websocket';const socket=this.webSocketFactory(wsUrl);let subscriptionId=1;socket.addEventListener('message',async message=>{const data=JSON.parse(message.data);if(data.type==='auth_required')socket.send(JSON.stringify({type:'auth',access_token:this.token}));else if(data.type==='auth_ok')socket.send(JSON.stringify({id:subscriptionId,type:'subscribe_events',event_type:'state_changed'}));else if(data.type==='event'&&data.event?.data?.entity_id)await handler({correlationId:data.event.context?.id||crypto.randomUUID(),externalDeviceId:data.event.data.entity_id,occurredAt:data.event.time_fired,state:data.event.data.new_state})});return async()=>socket.close();}
  async refreshCredentials(){}
  async healthCheck(){const started=Date.now();await this.request('/api/');return {status:'ok',latencyMs:Date.now()-started};}
}
