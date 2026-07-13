const recentFirst=(a,b)=>new Date(b.executedAt||b.createdAt||0)-new Date(a.executedAt||a.createdAt||0);
const deviceState=device=>device.online===false?'offline':device.error?'error':'online';

export class DashboardService {
  constructor({identity,repository,startedAt=new Date().toISOString(),version='0.1.0'}){
    this.identity=identity;this.repository=repository;this.startedAt=startedAt;this.version=version;
  }
  async get(homeId){
    const [devices,energy,automations,audit,integrations,notifications]=await Promise.all([
      this.repository.listDevices(homeId),this.repository.getEnergy(homeId),this.repository.listAutomations(homeId),
      this.identity.listAudit(homeId),this.identity.listIntegrations(homeId),this.repository.listNotifications(homeId)
    ]);
    const online=devices.filter(item=>item.online!==false).length;
    const lights=devices.filter(item=>item.type==='light');
    const cameras=devices.filter(item=>item.type==='camera');
    const climate=devices.find(item=>item.type==='ac'&&Number.isFinite(Number(item.temperature)));
    const criticalAlerts=notifications.filter(item=>!item.readAt&&item.severity==='error').length;
    const totalKwh=energy.readings.length?energy.readings.reduce((sum,item)=>sum+Number(item.kwh),0):null;
    const connected=integrations.filter(item=>item.status==='connected');
    return {
      generatedAt:new Date().toISOString(),
      security:{status:criticalAlerts?'attention':'protected',criticalAlerts,detail:criticalAlerts?`${criticalAlerts} alerta(s) crítico(s) não lido(s)`:'Nenhum alerta crítico'},
      internet:{status:integrations.length?(connected.length?'online':'degraded'):'not-configured',connectedProviders:connected.length,totalProviders:integrations.length,detail:integrations.length?`${connected.length} de ${integrations.length} integração(ões) conectada(s)`:'Nenhuma integração configurada'},
      devices:{total:devices.length,online,offline:devices.length-online,active:devices.filter(item=>item.power).length},
      cameras:{total:cameras.length,online:cameras.filter(item=>item.online!==false).length,items:cameras.map(item=>({id:item.id,name:item.name,room:item.room,status:deviceState(item)}))},
      climate:climate?{configured:true,temperature:Number(climate.temperature),room:climate.room,status:deviceState(climate)}:{configured:false,status:'empty'},
      lights:lights.map(item=>({id:item.id,name:item.name,room:item.room,online:item.online!==false,power:Boolean(item.power),brightness:item.brightness})),
      energy:{configured:energy.readings.length>0,totalKwh,estimatedCost:totalKwh!==null&&energy.settings.tariff!==null?totalKwh*energy.settings.tariff:null,currency:energy.settings.currency||'BRL',series:energy.readings.slice(-7).map(item=>({recordedAt:item.recordedAt,kwh:Number(item.kwh)}))},
      automations:automations.map(item=>({id:item.id,name:item.name,enabled:item.enabled,lastExecution:item.lastExecution||null})).filter(item=>item.lastExecution).sort((a,b)=>recentFirst(a.lastExecution,b.lastExecution)).slice(0,5),
      activity:audit.slice(0,8).map(item=>({id:item.id,type:item.type,targetId:item.targetId,result:item.result,createdAt:item.createdAt})),
      system:{version:this.version,persistence:this.repository.constructor.name.includes('Postgres')?'postgresql':'memory',startedAt:this.startedAt,realtime:'sse'}
    };
  }
}
