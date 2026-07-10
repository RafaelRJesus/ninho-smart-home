import { Activity, Gauge, Router, ShieldCheck, Thermometer } from 'lucide-react';

export function OperationalDashboard({ devices, connection, realtime, activity }) {
  const climate = devices.find(device => device.type === 'ac' && Number.isFinite(Number(device.temperature)));
  const offline = devices.filter(device => !device.online).length;
  const integrationLabel = connection === 'connected' ? 'Operacional' : connection === 'demo' ? 'Demonstração' : connection === 'error' ? 'Indisponível' : 'Verificando';
  const cards = [
    { icon: ShieldCheck, title: 'Segurança', value: 'Não configurado', detail: 'Adicione sensores e alarmes' },
    { icon: Router, title: 'Integrações', value: integrationLabel, detail: realtime === 'live' ? 'Atualização em tempo real' : 'Reconectando eventos' },
    { icon: Gauge, title: 'Energia', value: 'Não configurado', detail: 'Nenhum medidor vinculado' },
    { icon: Thermometer, title: 'Clima', value: climate ? `${climate.temperature}°C` : 'Não configurado', detail: climate ? climate.room : 'Nenhum sensor climático' }
  ];
  return <section className="operations" aria-label="Estado operacional da casa">
    <div className="operations-grid">{cards.map(({icon:Icon,...card})=><article key={card.title}><span><Icon/></span><small>{card.title}</small><b>{card.value}</b><p>{card.detail}</p></article>)}</div>
    <div className="activity-panel"><div><Activity/><h2>Atividade recente</h2><i className={realtime}/></div>{activity.length?<ol>{activity.slice(0,4).map(item=><li key={item.id}><span>{item.text}</span><time>{item.time}</time></li>)}</ol>:<p>Nenhuma alteração registrada nesta sessão.</p>}{offline>0&&<small className="activity-alert">{offline} dispositivo(s) offline</small>}</div>
  </section>;
}
