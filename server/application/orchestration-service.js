import crypto from 'node:crypto';

const controls = ['power','brightness','temperature'];
const validAction = action => action && typeof action.deviceId === 'string' && Object.keys(action.controls||{}).some(key=>controls.includes(key));

export class OrchestrationService {
  constructor({store,controlDevice,events}) { this.store=store;this.controlDevice=controlDevice;this.events=events;this.executions=new Set(); }
  createScene(input) {
    const name=String(input?.name||'').trim();const actions=Array.isArray(input?.actions)?input.actions:[];
    if(!name||!actions.length||actions.some(action=>!validAction(action)))throw Object.assign(new Error('Informe nome e pelo menos uma ação válida.'),{status:400});
    return this.store.upsertScene({id:input.id||crypto.randomUUID(),name,actions,createdAt:input.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
  }
  async executeScene(id,{executionId=crypto.randomUUID(),source='manual'}={}) {
    if(this.executions.has(executionId))return {executionId,status:'duplicate',results:[]};
    this.executions.add(executionId);setTimeout(()=>this.executions.delete(executionId),60000).unref?.();
    const scene=this.store.scenes.find(item=>item.id===id);if(!scene)throw Object.assign(new Error('Cena não encontrada.'),{status:404});
    const results=await Promise.all(scene.actions.map(async action=>{try{const device=await this.controlDevice(action.deviceId,action.controls);return {deviceId:action.deviceId,status:'succeeded',device};}catch(error){return {deviceId:action.deviceId,status:'failed',error:error.message};}}));
    const failures=results.filter(item=>item.status==='failed').length;const status=failures===0?'succeeded':failures===results.length?'failed':'partial';
    const execution={executionId,sceneId:id,sceneName:scene.name,status,source,results,executedAt:new Date().toISOString()};
    this.events.publish('scene.executed',{sceneId:id,name:scene.name,status});
    this.store.addNotification({id:crypto.randomUUID(),severity:status==='succeeded'?'success':'warning',title:`Cena ${scene.name}`,message:status==='partial'?'Executada parcialmente. Verifique os dispositivos.':status==='failed'?'Não foi possível executar a cena.':'Executada com sucesso.',createdAt:execution.executedAt,readAt:null});
    return execution;
  }
  createAutomation(input) {
    const name=String(input?.name||'').trim();if(!name||!input?.sceneId)throw Object.assign(new Error('Informe nome e cena da automação.'),{status:400});
    if(!this.store.scenes.some(item=>item.id===input.sceneId))throw Object.assign(new Error('Cena não encontrada.'),{status:400});
    return this.store.upsertAutomation({id:crypto.randomUUID(),name,sceneId:input.sceneId,trigger:input.trigger||{type:'manual'},conditions:Array.isArray(input.conditions)?input.conditions:[],enabled:input.enabled!==false,lastExecution:null,createdAt:new Date().toISOString()});
  }
  async runAutomation(id,executionId) {
    const automation=this.store.automations.find(item=>item.id===id);if(!automation)throw Object.assign(new Error('Automação não encontrada.'),{status:404});
    if(!automation.enabled)throw Object.assign(new Error('Automação desativada.'),{status:409});
    const result=await this.executeScene(automation.sceneId,{executionId,source:`automation:${id}`});
    automation.lastExecution={status:result.status,executedAt:new Date().toISOString()};this.store.upsertAutomation(automation);
    this.events.publish('automation.executed',{automationId:id,name:automation.name,status:result.status});return result;
  }
}
