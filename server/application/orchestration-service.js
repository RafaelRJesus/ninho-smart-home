import crypto from 'node:crypto';
import { AppError } from '../core/app-error.js';
import { deviceControls, ensureDeviceControllable, ensureSupportedControls } from '../domain/device.js';

const SAFE_CONTROLS=new Set(['power','brightness','temperature','color','volume','mediaAction']);
const OPERATORS=new Set(['eq','neq','gt','gte','lt','lte']);
const fail=(code,message,status=400)=>new AppError(code,message,status);
const keyOf=(deviceId,field)=>`${deviceId}:${field}`;
const triggerKey=trigger=>trigger?.type==='device_state'?keyOf(trigger.deviceId,trigger.field):trigger?.type==='schedule'?`schedule:${trigger.at}:${(trigger.days||[]).join(',')}`:'manual';
const compare=(actual,operator,expected)=>({eq:actual===expected,neq:actual!==expected,gt:actual>expected,gte:actual>=expected,lt:actual<expected,lte:actual<=expected})[operator];

function predicate(input,label='Gatilho'){
  if(!input||typeof input!=='object')throw fail('VALIDATION_ERROR',`${label} inválido.`);
  const deviceId=String(input.deviceId||'').trim();const field=String(input.field||'').trim();const operator=input.operator||'eq';
  if(!deviceId||!field||!OPERATORS.has(operator)||input.value===undefined)throw fail('VALIDATION_ERROR',`${label} de dispositivo incompleto.`);
  return {deviceId,field,operator,value:input.value};
}

export function validateScene(input,devices){
  const name=String(input?.name||'').trim();const actions=Array.isArray(input?.actions)?input.actions:[];
  if(!name||name.length>80)throw fail('VALIDATION_ERROR','Informe um nome de até 80 caracteres.');
  if(!actions.length||actions.length>50)throw fail('VALIDATION_ERROR','Informe entre 1 e 50 ações.');
  const available=new Map(devices.map(item=>[item.id,item]));
  return {name,actions:actions.map(action=>{const device=available.get(action?.deviceId);if(!device)throw fail('VALIDATION_ERROR','A cena contém um dispositivo inválido.');const controls=deviceControls(action?.controls||{});if(!Object.keys(controls).length)throw fail('VALIDATION_ERROR','A cena contém uma ação vazia.');if(Object.keys(controls).some(item=>!SAFE_CONTROLS.has(item)))throw fail('CRITICAL_ACTION_NOT_ALLOWED','Ações críticas devem ser executadas manualmente com confirmação e PIN.',409);ensureSupportedControls(device,controls);return {deviceId:device.id,controls};})};
}

export function validateAutomation(input){
  const name=String(input?.name||'').trim();if(!name||name.length>80)throw fail('VALIDATION_ERROR','Informe um nome de até 80 caracteres.');
  const raw=input?.trigger||{type:'manual'};let trigger;
  if(raw.type==='manual')trigger={type:'manual'};
  else if(raw.type==='device_state')trigger={type:'device_state',...predicate(raw)};
  else if(raw.type==='schedule'){
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(raw.at||'')))throw fail('VALIDATION_ERROR','Horário do gatilho inválido.');
    const days=Array.isArray(raw.days)?raw.days.map(Number):[];if(days.some(day=>!Number.isInteger(day)||day<0||day>6))throw fail('VALIDATION_ERROR','Dias do gatilho inválidos.');trigger={type:'schedule',at:raw.at,days:[...new Set(days)]};
  } else throw fail('VALIDATION_ERROR','Tipo de gatilho não suportado.');
  const conditions=(Array.isArray(input?.conditions)?input.conditions:[]).map(item=>predicate(item,'Condição'));
  return {name,sceneId:String(input?.sceneId||''),trigger,conditions,enabled:input?.enabled!==false};
}

function outputMap(scene){const map=new Map();for(const action of scene.actions)for(const [field,value] of Object.entries(action.controls))map.set(keyOf(action.deviceId,field),value);return map;}

export class OrchestrationService {
  constructor({repository,controlExternal,events}){this.repository=repository;this.controlExternal=controlExternal;this.events=events;}

  async createScene(homeId,input){const valid=validateScene(input,await this.repository.listDevices(homeId));return this.repository.saveScene(homeId,{...input,...valid});}

  async validateTopology(homeId,candidate){
    const scenes=await this.repository.listScenes(homeId);const sceneById=new Map(scenes.map(item=>[item.id,item]));if(!sceneById.has(candidate.sceneId))throw fail('VALIDATION_ERROR','Cena inválida.');
    const automations=(await this.repository.listAutomations(homeId)).filter(item=>item.id!==candidate.id&&item.enabled);const active=candidate.enabled?[...automations,candidate]:automations;
    const edges=new Map();for(const automation of active){if(automation.trigger.type!=='device_state')continue;const from=keyOf(automation.trigger.deviceId,automation.trigger.field);const outputs=outputMap(sceneById.get(automation.sceneId)||{actions:[]});edges.set(from,new Set([...(edges.get(from)||[]),...outputs.keys()]));}
    const visiting=new Set(),visited=new Set();const cycle=node=>{if(visiting.has(node))return true;if(visited.has(node))return false;visiting.add(node);for(const next of edges.get(node)||[])if(cycle(next))return true;visiting.delete(node);visited.add(node);return false;};
    if([...edges.keys()].some(cycle))throw fail('AUTOMATION_LOOP_DETECTED','Esta automação criaria um ciclo entre gatilhos e ações.',409);
    const candidateOutputs=outputMap(sceneById.get(candidate.sceneId));const conflicts=[];for(const item of automations){if(triggerKey(item.trigger)!==triggerKey(candidate.trigger))continue;const outputs=outputMap(sceneById.get(item.sceneId)||{actions:[]});for(const [key,value] of candidateOutputs)if(outputs.has(key)&&JSON.stringify(outputs.get(key))!==JSON.stringify(value)){conflicts.push(item.id);break;}}
    return conflicts;
  }

  async saveAutomation(homeId,input){const valid=validateAutomation(input);const candidate={...input,...valid};const conflicts=await this.validateTopology(homeId,candidate);const saved=await this.repository.saveAutomation(homeId,{...candidate,conflicts,lastExecution:input.lastExecution||null});if(conflicts.length)await this.repository.addNotification(homeId,{severity:'warning',title:'Conflito de automação',message:`${saved.name} possui ações incompatíveis com ${conflicts.length} automação(ões) no mesmo gatilho.`});return {...saved,conflicts};}

  async executeScene(homeId,sceneId,{executionId=crypto.randomUUID(),source='manual',automationId=null}={}){
    const scenes=await this.repository.listScenes(homeId);const scene=scenes.find(item=>item.id===sceneId);if(!scene)throw fail('NOT_FOUND','Cena não encontrada.',404);
    const claimed=await this.repository.claimOrchestrationExecution(homeId,{executionId,sceneId,automationId,source});if(!claimed)return {executionId,sceneId,status:'duplicate',results:[]};
    const results=[];for(const action of scene.actions){try{const device=await this.repository.findDevice(homeId,action.deviceId);if(!device)throw fail('NOT_FOUND','Dispositivo não encontrado.',404);ensureDeviceControllable(device,action.controls);ensureSupportedControls(device,action.controls);if(this.controlExternal&&device.integrationId)await this.controlExternal(homeId,device,action.controls);const changed=await this.repository.updateDevice(homeId,device.id,{...action.controls,version:device.version});if(!changed)throw fail('VERSION_CONFLICT','Dispositivo alterado por outra execução.',409);results.push({deviceId:device.id,status:'succeeded',device:changed});this.events?.publish('device.updated',{homeId,deviceId:device.id,...action.controls,source,causationId:executionId});}catch(error){results.push({deviceId:action.deviceId,status:'failed',code:error.code||'ACTION_FAILED',error:error.message});}}
    const failures=results.filter(item=>item.status==='failed').length;const status=failures===0?'succeeded':failures===results.length?'failed':'partial';const finished=await this.repository.finishOrchestrationExecution(homeId,executionId,{status,results});
    await this.repository.addNotification(homeId,{severity:status==='succeeded'?'success':'warning',title:`Cena ${scene.name}`,message:status==='succeeded'?'Executada com sucesso.':status==='partial'?'Executada parcialmente. Verifique os dispositivos.':'Não foi possível executar a cena.'});
    this.events?.publish('scene.executed',{homeId,sceneId,automationId,status,executionId});return finished;
  }

  async runAutomation(homeId,id,{executionId=crypto.randomUUID(),source='manual'}={}){const automation=(await this.repository.listAutomations(homeId)).find(item=>item.id===id);if(!automation)throw fail('NOT_FOUND','Automação não encontrada.',404);if(!automation.enabled)throw fail('AUTOMATION_DISABLED','Automação desativada.',409);const result=await this.executeScene(homeId,automation.sceneId,{executionId,source,automationId:id});if(result.status!=='duplicate'){const lastExecution={executionId,status:result.status,executedAt:new Date().toISOString(),source};await this.repository.saveAutomation(homeId,{...automation,lastExecution});this.events?.publish('automation.executed',{homeId,automationId:id,status:result.status,executionId});}return result;}

  async processDeviceEvent(event){if(event?.type!=='device.updated'||!event.payload?.homeId)return [];const {homeId,deviceId}=event.payload;const devices=await this.repository.listDevices(homeId);const device=devices.find(item=>item.id===deviceId);if(!device)return [];const automations=(await this.repository.listAutomations(homeId)).filter(item=>item.enabled&&item.trigger?.type==='device_state'&&item.trigger.deviceId===deviceId);const results=[];for(const item of automations){const actual=event.payload[item.trigger.field]??device[item.trigger.field];if(!compare(actual,item.trigger.operator,item.trigger.value))continue;const conditions=item.conditions||[];if(!conditions.every(condition=>{const target=devices.find(value=>value.id===condition.deviceId);return target&&compare(target[condition.field],condition.operator,condition.value);} ))continue;results.push(await this.runAutomation(homeId,item.id,{executionId:`${event.id}:${item.id}`,source:'device-event'}));}return results;}

  async tick(homeId,now=new Date()){const local=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;const automations=(await this.repository.listAutomations(homeId)).filter(item=>item.enabled&&item.trigger?.type==='schedule'&&item.trigger.at===local&&(!item.trigger.days?.length||item.trigger.days.includes(now.getDay())));return Promise.all(automations.map(item=>this.runAutomation(homeId,item.id,{executionId:`schedule:${homeId}:${item.id}:${now.toISOString().slice(0,16)}`,source:'schedule'})));}
  async tickAll(now=new Date()){const homes=await this.repository.listAutomationHomeIds();return Promise.all(homes.map(homeId=>this.tick(homeId,now)));}
}
