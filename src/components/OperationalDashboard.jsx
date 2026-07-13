import React from 'react';
import {Activity,Camera,CloudOff,Database,Home,LockKeyhole,RefreshCw,ShieldCheck,SunMedium,Thermometer,Wifi,WifiOff,Zap} from 'lucide-react';

const activityLabels={HOME_CREATED:'Residência criada',DEVICE_CREATED:'Dispositivo adicionado',DEVICE_UPDATED:'Dispositivo atualizado',DEVICE_DELETED:'Dispositivo removido',ROOM_CREATED:'Ambiente criado',ROOM_UPDATED:'Ambiente atualizado',INTEGRATION_SYNCED:'Integração sincronizada'};
const time=value=>value?new Date(value).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—';
const money=(value,currency='BRL')=>new Intl.NumberFormat('pt-BR',{style:'currency',currency}).format(value||0);

function BlockState({kind='empty',title,detail,onRetry}){
  const Icon=kind==='error'?CloudOff:kind==='offline'?WifiOff:Home;
  return <div className={`dashboard-state ${kind}`} role={kind==='error'?'alert':'status'}><Icon/><b>{title}</b><p>{detail}</p>{onRetry&&<button className="secondary" onClick={onRetry}><RefreshCw/> Tentar novamente</button>}</div>;
}

function MetricCard({icon:Icon,label,value,detail,status='neutral'}){
  return <article className={`metric-card ${status}`}><span><Icon/></span><div><small>{label}</small><b>{value}</b><p>{detail}</p></div></article>;
}

function EnergyChart({energy}){
  if(!energy?.configured)return <BlockState title="Energia ainda não configurada" detail="Adicione leituras na área de Rotinas para acompanhar o consumo."/>;
  const values=energy.series.map(item=>item.kwh);const max=Math.max(...values,1);
  const points=values.map((value,index)=>`${values.length===1?50:(index/(values.length-1))*100},${42-(value/max)*36}`).join(' ');
  return <div className="energy-chart"><div><span><Zap/></span><div><small>CONSUMO ACUMULADO</small><b>{energy.totalKwh.toFixed(2)} kWh</b><p>{energy.estimatedCost===null?'Tarifa não configurada':`Estimativa ${money(energy.estimatedCost,energy.currency)}`}</p></div></div><svg viewBox="0 0 100 46" role="img" aria-label="Gráfico das últimas leituras de energia"><polyline points={points}/>{energy.series.map((item,index)=><circle key={item.recordedAt||index} cx={values.length===1?50:(index/(values.length-1))*100} cy={42-(item.kwh/max)*36} r="1.7"><title>{item.kwh} kWh</title></circle>)}</svg></div>;
}

export function OperationalDashboard({data,loading,error,connection,realtime,sessionActivity=[],onRetry,update}){
  if(loading&&!data)return <section className="dashboard-loading" aria-label="Carregando dashboard" aria-busy="true">{[1,2,3,4,5,6].map(item=><div key={item} className="dashboard-skeleton"/>)}</section>;
  if(error&&!data)return <BlockState kind="error" title="Não foi possível carregar o painel" detail={error} onRetry={onRetry}/>;
  if(!data)return <BlockState title="Dashboard indisponível" detail="Não há dados operacionais para exibir."/>;
  const offline=connection==='error';
  const activities=[...sessionActivity.map(item=>({...item,createdAt:item.occurredAt||new Date().toISOString()})),...data.activity].slice(0,6);
  return <section className={`operational-dashboard ${offline?'is-offline':''}`} data-testid="dashboard-ready" aria-label="Dashboard operacional">
    {offline&&<BlockState kind="offline" title="Dados locais disponíveis" detail="A conexão caiu. Os indicadores podem estar desatualizados." onRetry={onRetry}/>}
    <div className="metric-grid">
      <MetricCard icon={ShieldCheck} label="Segurança" value={data.security.status==='protected'?'Protegida':'Atenção'} detail={data.security.detail} status={data.security.status==='protected'?'good':'warn'}/>
      <MetricCard icon={data.internet.status==='online'?Wifi:WifiOff} label="Internet e hubs" value={data.internet.status==='online'?'Conectada':data.internet.status==='degraded'?'Instável':'Não configurada'} detail={data.internet.detail} status={data.internet.status==='online'?'good':data.internet.status==='degraded'?'warn':'neutral'}/>
      <MetricCard icon={Thermometer} label="Clima" value={data.climate.configured?`${data.climate.temperature}°C`:'Não configurado'} detail={data.climate.configured?data.climate.room:'Nenhum sensor climático'} status={data.climate.status==='offline'?'warn':'neutral'}/>
      <MetricCard icon={Camera} label="Câmeras" value={data.cameras.total?`${data.cameras.online} de ${data.cameras.total}`:'Nenhuma'} detail={data.cameras.total?'câmeras online':'Nenhuma câmera vinculada'} status={data.cameras.total&&data.cameras.online<data.cameras.total?'warn':'neutral'}/>
      <MetricCard icon={Home} label="Dispositivos" value={`${data.devices.online} de ${data.devices.total}`} detail={`${data.devices.active} ativo(s) · ${data.devices.offline} offline`} status={data.devices.offline?'warn':'good'}/>
      <MetricCard icon={Activity} label="Tempo real" value={realtime==='live'?'Ao vivo':'Reconectando'} detail={`Atualizado às ${time(data.generatedAt)}`} status={realtime==='live'?'good':'warn'}/>
    </div>
    <div className="dashboard-detail-grid">
      <section className="dashboard-panel lights-panel"><header><div><SunMedium/><h2>Luzes</h2></div><small>{data.lights.filter(item=>item.power).length} acesa(s)</small></header>{data.lights.length?<ul>{data.lights.slice(0,6).map(light=><li key={light.id}><button disabled={!light.online} aria-label={`${light.power?'Desligar':'Ligar'} ${light.name}`} aria-pressed={light.power} onClick={()=>update(light.id,{power:!light.power})}><i className={light.power?'on':''}/><span><b>{light.name}</b><small>{light.room} · {light.online?(light.power?'Acesa':'Apagada'):'Offline'}</small></span></button></li>)}</ul>:<BlockState title="Nenhuma luz vinculada" detail="As luzes sincronizadas aparecerão aqui."/>}</section>
      <EnergyChart energy={data.energy}/>
      <section className="dashboard-panel"><header><div><Activity/><h2>Automações recentes</h2></div></header>{data.automations.length?<ol className="compact-list">{data.automations.map(item=><li key={item.id}><span><b>{item.name}</b><small>{item.lastExecution?.status||'executada'}</small></span><time>{time(item.lastExecution?.executedAt)}</time></li>)}</ol>:<BlockState title="Nenhuma execução recente" detail="As automações executadas aparecerão aqui."/>}</section>
      <section className="dashboard-panel"><header><div><LockKeyhole/><h2>Atividade</h2></div><i className={realtime}/></header>{activities.length?<ol className="compact-list">{activities.map(item=><li key={item.id}><span><b>{item.text||activityLabels[item.type]||'Atividade da residência'}</b><small>{item.result||'concluído'}</small></span><time>{item.time||time(item.createdAt)}</time></li>)}</ol>:<BlockState title="Nenhuma atividade" detail="As mudanças da casa aparecerão em tempo real."/>}</section>
    </div>
    <footer className="system-strip"><span><Database/> Ninho {data.system.version}</span><span>Persistência: {data.system.persistence}</span><span>SSE: {realtime==='live'?'conectado':'reconectando'}</span></footer>
  </section>;
}
