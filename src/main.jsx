import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, LayoutDashboard, Map, Mic, Plus, Power, Send, Settings, Sparkles, Thermometer, Tv, Lamp, PlugZap, Wifi, WifiOff, X, RefreshCw, ArrowUp, ArrowDown, Trash2, DoorOpen, Pencil, Search, AlertCircle, CheckCircle2, Info, Clock, Moon, Sun, Workflow, LockKeyhole, LogOut, Camera, Play, Pause, Square, Volume2, VolumeX, Palette, ShieldCheck } from 'lucide-react';
import { OperationalDashboard } from './components/OperationalDashboard.jsx';
import { FloorplanEditor } from './components/FloorplanEditor.jsx';
import { AutomationCenter } from './components/AutomationCenter.jsx';
import { useRealtime } from './hooks/useRealtime.js';
import { confirmedDevice, failedDevice, isDeviceControl, pendingDevice } from './domain/device-command.js';
import { isCriticalDeviceControl, supportedControls } from './domain/device-capabilities.js';
import './design-system/tokens.css';
import './styles.css';

const homeApi = homeId => `/api/v1/homes/${homeId}`;
const icons = { light: Lamp, ac: Thermometer, tv: Tv, plug: PlugZap, lock:LockKeyhole, cover:DoorOpen, camera:Camera };

function DeviceIcon({ type, size = 20 }) { const Icon = icons[type] || PlugZap; return <Icon size={size} />; }

function App({user,home,onLogout}) {
  const API=homeApi(home.id);
  const [devices, setDevices] = useState([]);
  const [view, setView] = useState('dashboard');
  const [command, setCommand] = useState('');
  const [messages, setMessages] = useState([{ from: 'ai', text: 'Olá! Sua casa está tranquila. Como posso ajudar?' }]);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState({ mode: 'demo' });
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [managingRooms, setManagingRooms] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState('checking');
  const [lastSync, setLastSync] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [query, setQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('Todos');
  const [activity, setActivity] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardRevision, setDashboardRevision] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('ninho-theme') || 'dark');
  const [floorplanDirty,setFloorplanDirty]=useState(false);
  function navigate(next){if(view==='plant'&&floorplanDirty&&!window.confirm('Você possui alterações não salvas na planta. Deseja sair e descartá-las?'))return;setFloorplanDirty(false);setView(next);}

  const receiveEvent = useCallback(event => {
    if (!event.type?.startsWith('device.')) return;
    const label = event.type === 'device.created' ? `${event.payload.name} foi adicionado` : `${event.payload.name} foi atualizado`;
    setActivity(items => [{ id: event.id, text: label, time: new Date(event.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...items].slice(0, 10));
    setDevices(items => items.map(device => device.id === event.payload.deviceId ? { ...device, ...event.payload, id: device.id } : device));
    setDashboardRevision(value=>value+1);
  }, []);
  const realtime = useRealtime(receiveEvent,`${API}/events`);

  function notify(text,type='info'){const id=Date.now()+Math.random();setToasts(items=>[...items,{id,text,type}]);setTimeout(()=>setToasts(items=>items.filter(item=>item.id!==id)),4500)}
  const load = async (mode=status.mode) => { setLoading(true); try { const r=await fetch(`${API}/devices`); const data=await r.json(); if(!r.ok)throw new Error(data.error||'Não foi possível carregar os dispositivos.'); setDevices(data);setConnection(mode==='demo'?'demo':'connected');setLastSync(new Date());return data } catch(error){setConnection('error');notify(error.message,'error');return []} finally{setLoading(false)} };
  const loadRooms = () => fetch(`${API}/rooms`).then(r => r.json()).then(setRooms);
  const loadDashboard = useCallback(async()=>{setDashboardLoading(true);setDashboardError('');try{const response=await fetch(`${API}/dashboard`);const result=await response.json();if(!response.ok)throw new Error(result.message||result.error||'Falha ao carregar o dashboard.');setDashboard(result);}catch(error){setDashboardError(error.message);}finally{setDashboardLoading(false)}},[API]);
  useEffect(() => { loadRooms(); fetch(`${API}/status`).then(r=>r.json()).then(data=>{setStatus(data);load(data.mode)}); }, []);
  useEffect(()=>{loadDashboard()},[loadDashboard,dashboardRevision]);
  useEffect(() => { document.documentElement.dataset.theme=theme; localStorage.setItem('ninho-theme',theme); }, [theme]);
  const active = devices.filter(d => d.power).length;
  const filteredDevices = devices.filter(device => (roomFilter==='Todos'||device.room===roomFilter) && `${device.name} ${device.room}`.toLowerCase().includes(query.toLowerCase()));
  const temperature = devices.find(d => d.type === 'ac')?.temperature;
  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toUpperCase();

  async function update(id, patch, options={}) {
    const current=devices.find(device=>device.id===id);
    if(!current)return null;
    const controls=isDeviceControl(patch);
    const requestId=controls?crypto.randomUUID():undefined;
    if(controls){const optimistic=pendingDevice(current,patch,requestId);setDevices(items=>items.map(device=>device.id===id?optimistic:device));setSelected(device=>device?.id===id?optimistic:device);}
    try {
      const r = await fetch(`${API}/devices/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json',...(options.pin?{'x-action-pin':options.pin}:{}) }, body: JSON.stringify({...patch,version:current?.version,requestId,confirmed:options.confirmed}) });
      const changed = await r.json();
      if (!r.ok) throw new Error(changed.message||changed.error||'Não foi possível confirmar o comando.');
      const finalDevice=controls?confirmedDevice(changed,requestId):changed;
      setDevices(ds => ds.map(d => d.id === id ? finalDevice : d)); setSelected(selected => selected?.id === id ? finalDevice : selected);
      setDashboardRevision(value=>value+1);
      notify(`${changed.name}: alteração salva.`,'success');
      return finalDevice;
    } catch (error) {
      if(controls){const restored=failedDevice(current,requestId,error.message);setDevices(items=>items.map(device=>device.id===id?restored:device));setSelected(device=>device?.id===id?restored:device);}
      notify(error.message,'error');return null;
    }
  }
  async function send(text = command) {
    if (!text.trim()) return;
    setMessages(m => [...m, { from: 'user', text }]); setCommand(''); setBusy(true);
    try { const r = await fetch(`${API}/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const data = await r.json(); if(!r.ok)throw new Error(data.error);setMessages(m => [...m, { from: 'ai', text: data.reply }]);notify(data.reply,'success');await load();
    } catch(error) { notify(error.message||'Não foi possível falar com o servidor.','error'); }
    finally { setBusy(false); }
  }
  function listen() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setMessages(m => [...m, { from: 'ai', text: 'O reconhecimento de voz não está disponível neste navegador. Use Chrome ou Edge.' }]);
    const rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = false; setListening(true);
    rec.onresult = e => { const text = e.results[0][0].transcript; setCommand(text); send(text); };
    rec.onend = () => setListening(false); rec.start();
  }

  return <div className="app">
    <aside>
      <div className="brand"><span><Home size={20}/></span> Ninho</div>
      <nav>
        <button aria-label="Visão geral" aria-current={view==='dashboard'?'page':undefined} className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><LayoutDashboard/> <span>Visão geral</span></button>
        <button aria-label="Minha planta" aria-current={view==='plant'?'page':undefined} className={view === 'plant' ? 'active' : ''} onClick={() => setView('plant')}><Map/> <span>Minha planta</span></button>
        <button aria-label="Rotinas" aria-current={view==='routines'?'page':undefined} className={view === 'routines' ? 'active' : ''} onClick={() => navigate('routines')}><Workflow/> <span>Rotinas</span></button>
        <button aria-label="Configurações" aria-current={view==='settings'?'page':undefined} className={view === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Settings/> <span>Configurações</span></button>
      </nav>
      <div className="house-state"><div className="state-icon"><Sparkles/></div><b>Casa conectada</b><small>{devices.filter(d => d.online).length} de {devices.length} dispositivos online</small><div className="bar"><i style={{width:`${devices.length ? devices.filter(d=>d.online).length/devices.length*100 : 0}%`}}/></div></div>
      <button className="theme-toggle" onClick={()=>setTheme(value=>value==='dark'?'light':'dark')} aria-label={`Ativar tema ${theme==='dark'?'claro':'escuro'}`}>{theme==='dark'?<Sun/>:<Moon/>}<span>{theme==='dark'?'Tema claro':'Tema escuro'}</span></button>
      <div className="profile"><div className="avatar">{user.displayName.slice(0,2).toUpperCase()}</div><div><b>{home?.name||'Minha casa'}</b><small>{user.displayName}</small></div><button aria-label="Sair" onClick={onLogout}><LogOut/></button></div>
    </aside>

    <main>
      <header><div><p>{today}</p><h1>{view === 'plant' ? 'Planta da casa' : view === 'settings' ? 'Configurações' : view==='routines'?'Rotinas inteligentes':'Olá!'} <span>👋</span></h1><small>{view === 'dashboard' ? 'Tudo sob controle por aqui.' : view==='routines'?'Cenas, automações, alertas e energia em um só lugar.':'Organize sua casa conectada.'}</small></div><ConnectionBadge connection={connection} mode={status.mode}/></header>

      {view === 'dashboard' && <>
        <section className="hero"><div><div className="ai-label"><Sparkles size={15}/> ASSISTENTE NINHO</div><h2>O que você gostaria de fazer?</h2><p>Controle sua casa naturalmente, por voz ou texto.</p><div className="command"><button aria-label="Comando de voz" className={listening ? 'recording' : ''} onClick={listen}><Mic/></button><input disabled={busy} value={command} onChange={e=>setCommand(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={busy?'Executando comando...':'Ex: Apague as luzes da sala...'}/><button aria-label="Enviar comando" disabled={busy} onClick={()=>send()}>{busy?<RefreshCw className="spin"/>:<Send/>}</button></div><div className="suggestions">{['Acender luz da sala','Ar em 22 graus','Desligar tudo'].map(x=><button key={x} onClick={()=>send(x)}>{x}</button>)}</div>{messages.at(-1)?.from==='ai'&&<div className="assistant-reply"><Sparkles/>{messages.at(-1).text}</div>}</div><div className="orb"><Sparkles size={38}/></div></section>
        <div className="stats"><article><span><Power/></span><div><b>{active}</b><small>Dispositivos ativos</small></div></article><article><span><Thermometer/></span><div><b>{temperature ? `${temperature}°C` : '—'}</b><small>Temperatura interna</small></div></article><article><span><Home/></span><div><b>{rooms.length}</b><small>Ambientes</small></div></article></div>
        <OperationalDashboard data={dashboard} loading={dashboardLoading} error={dashboardError} connection={connection} realtime={realtime} sessionActivity={activity} onRetry={()=>{load();loadDashboard()}} update={update}/>
        <div className="section-title"><div><h2>Seus dispositivos</h2><p>{lastSync?`Atualizado às ${lastSync.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Controle rápido dos seus aparelhos'}</p></div><button className="link" onClick={()=>setView('plant')}>Ver na planta →</button></div>
        <div className="device-tools"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar dispositivo..."/></label><div className="room-filters"><button className={roomFilter==='Todos'?'active':''} onClick={()=>setRoomFilter('Todos')}>Todos</button>{rooms.map(room=><button key={room.id} className={roomFilter===room.name?'active':''} onClick={()=>setRoomFilter(room.name)}>{room.name}</button>)}</div></div>
        {loading?<DeviceSkeleton/>:filteredDevices.length?<div className="devices">{filteredDevices.map(d=><DeviceCard key={d.id} d={d} update={update} select={setSelected}/>)}</div>:<EmptyState hasQuery={Boolean(query||roomFilter!=='Todos')} clear={()=>{setQuery('');setRoomFilter('Todos')}} sync={load}/>} 
      </>}

      {view === 'plant' && <FloorplanEditor mode={status.mode} devices={devices} rooms={rooms} update={update} select={setSelected} add={()=>status.mode==='tuya'?notify('Adicione o aparelho no Smart Life e clique em Sincronizar.','info'):setAdding(true)} manage={()=>setManagingRooms(true)} apiBase={API} notify={notify} onDirtyChange={setFloorplanDirty}/>}
      {view === 'routines' && <AutomationCenter devices={devices} notify={notify} apiBase={API}/>}
      {view === 'settings' && <SettingsView status={status} connection={connection} deviceCount={devices.length} lastSync={lastSync} reload={load} notify={notify} home={home}/>} 
    </main>

    <ToastStack items={toasts} close={id=>setToasts(items=>items.filter(item=>item.id!==id))}/>
    {selected && <DevicePanel d={selected} rooms={rooms} update={update} close={()=>setSelected(null)}/>} 
    {adding && <AddDevice apiBase={API} close={()=>setAdding(false)} saved={d=>{setDevices(x=>[...x,d]);setAdding(false)}} rooms={rooms}/>}
    {managingRooms && <RoomManager apiBase={API} rooms={rooms} changed={setRooms} close={()=>setManagingRooms(false)}/>}
  </div>
}

function ConnectionBadge({connection,mode}) { const labels={checking:'Verificando...',connected:'Tuya conectado',demo:'Modo demonstração',error:'Falha na conexão'};return <div className={`mode ${connection}`}><i/>{labels[connection]||labels[mode]}</div> }
function ToastStack({items,close}) { const icons={success:CheckCircle2,error:AlertCircle,info:Info};return <div className="toast-stack" aria-live="polite">{items.map(item=>{const Icon=icons[item.type]||Info;return <div className={`toast ${item.type}`} key={item.id}><Icon/><span>{item.text}</span><button aria-label="Fechar notificação" onClick={()=>close(item.id)}><X/></button></div>})}</div> }
function DeviceSkeleton(){return <div className="devices skeletons">{[1,2,3,4].map(x=><div className="device skeleton" key={x}><i/><i/><i/></div>)}</div>}
function EmptyState({hasQuery,clear,sync}){return <div className="empty-state"><div><PlugZap/></div><h3>{hasQuery?'Nenhum resultado':'Nenhum dispositivo encontrado'}</h3><p>{hasQuery?'Tente outro nome ou ambiente.':'Vincule sua conta Smart Life/Tuya ou sincronize novamente.'}</p><button className="primary" onClick={hasQuery?clear:()=>sync()}>{hasQuery?'Limpar filtros':'Sincronizar dispositivos'}</button></div>}

function DeviceCard({d,update,select}) {const hasPower=supportedControls(d).has('power');return <article role="button" tabIndex="0" aria-label={`Abrir ${d.name}`} className={`device ${d.power?'on':''} ${!d.online?'unavailable':''}`} onClick={()=>select(d)} onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&select(d)}><div className="device-top"><span><DeviceIcon type={d.type}/></span>{hasPower?<button aria-label={`${d.power?'Desligar':'Ligar'} ${d.name}`} aria-pressed={d.power} disabled={!d.online} className={`switch ${d.power?'on':''}`} onClick={e=>{e.stopPropagation();update(d.id,{power:!d.power})}}><i/></button>:<span className="device-state-badge" aria-label="Controle disponível no painel"><ShieldCheck/></span>}</div><h3>{d.name}</h3><p>{d.room}</p><div className="device-foot"><small className={d.online?'online':'offline'}>{d.online?<Wifi/>:<WifiOff/>}{d.online?'Online':'Offline'}</small><b>{hasPower?(d.power?'Ligado':'Desligado'):'Protegido'}</b></div></article> }

function DevicePanel({d,rooms,update,close}) {
  const controls=supportedControls(d);const [values,setValues]=useState({brightness:d.brightness??50,temperature:d.temperature??23,volume:d.volume??30,position:d.position??0,color:d.color||'#38f2ac'});const [critical,setCritical]=useState(null);const [pin,setPin]=useState('');
  const pending=d.commandStatus==='pending';const commandFailed=d.commandStatus==='failed';const operationalError=d.error||d.status==='error';const available=d.online&&!operationalError&&!pending;
  const send=(control,value)=>{if(isCriticalDeviceControl(d,control)){setCritical({[control]:value});setPin('');return;}return available&&update(d.id,{[control]:value});};
  const commit=control=>available&&update(d.id,{[control]:control==='color'?values[control]:Number(values[control])});
  const confirm=async()=>{if(!pin.trim())return;const value=critical;setCritical(null);await update(d.id,value,{confirmed:true,pin});setPin('');};
  return <div className="overlay" onClick={close}><div className="panel advanced-device-panel" role="dialog" aria-modal="true" aria-label={`Controle de ${d.name}`} onClick={e=>e.stopPropagation()}><button aria-label="Fechar" className="close" onClick={close}><X/></button><div className="big-icon"><DeviceIcon type={d.type} size={30}/></div><h2>{d.name}</h2><p>{d.room} · {d.online?'Online':'Offline'}</p>
    {!d.online&&<div className="device-warning"><WifiOff/>Este aparelho está offline. Os controles estão indisponíveis.</div>}{pending&&<div className="device-warning pending" role="status"><RefreshCw className="spin"/>Aguardando confirmação do dispositivo.</div>}{(commandFailed||operationalError)&&<div className="device-warning error" role="alert"><AlertCircle/>{d.commandError||'O dispositivo informou um erro. Tente novamente.'}</div>}
    {controls.has('power')&&<button disabled={!available} aria-busy={pending} className={`power-button ${d.power?'on':''}`} onClick={()=>send('power',!d.power)}><Power/> {pending?'Confirmando...':commandFailed?'Tentar novamente':d.power?'Desligar':'Ligar'}</button>}
    <label>Ambiente<select disabled={pending} value={d.room} onChange={e=>update(d.id,{room:e.target.value})}>{rooms.map(room=><option key={room.id}>{room.name}</option>)}</select></label>
    {controls.has('brightness')&&<ControlRange label="Brilho" value={values.brightness} unit="%" disabled={!available} onChange={value=>setValues({...values,brightness:value})} onCommit={()=>commit('brightness')}/>}
    {controls.has('temperature')&&<ControlRange label="Temperatura" value={values.temperature} min={16} max={30} unit="°C" disabled={!available} onChange={value=>setValues({...values,temperature:value})} onCommit={()=>commit('temperature')}/>}
    {controls.has('color')&&<label className="color-control"><span><Palette/>Cor da iluminação</span><input aria-label="Cor da iluminação" disabled={!available} type="color" value={values.color} onChange={e=>setValues({...values,color:e.target.value})} onBlur={()=>commit('color')}/></label>}
    {controls.has('volume')&&<ControlRange label="Volume" value={values.volume} unit="%" disabled={!available} onChange={value=>setValues({...values,volume:value})} onCommit={()=>commit('volume')}/>}
    {controls.has('mediaAction')&&<div className="media-controls" aria-label="Controles de mídia"><button disabled={!available} aria-label="Reproduzir" onClick={()=>send('mediaAction','play')}><Play/></button><button disabled={!available} aria-label="Pausar" onClick={()=>send('mediaAction','pause')}><Pause/></button><button disabled={!available} aria-label="Parar" onClick={()=>send('mediaAction','stop')}><Square/></button><button disabled={!available} aria-label="Silenciar" onClick={()=>send('mediaAction','mute')}><VolumeX/></button><button disabled={!available} aria-label="Ativar som" onClick={()=>send('mediaAction','unmute')}><Volume2/></button></div>}
    {controls.has('locked')&&<button disabled={!available} className="critical-action" onClick={()=>send('locked',!d.locked)}><LockKeyhole/>{d.locked?'Destrancar':'Trancar'} fechadura</button>}
    {controls.has('position')&&<ControlRange label="Abertura do portão" value={values.position} unit="%" disabled={!available} onChange={value=>setValues({...values,position:value})} onCommit={()=>send('position',Number(values.position))}/>}
    {controls.has('cameraAction')&&<div className="camera-controls"><button disabled={!available} className="critical-action" onClick={()=>send('cameraAction','privacy_on')}><Camera/>Ativar privacidade</button><button disabled={!available} className="secondary" onClick={()=>send('cameraAction','privacy_off')}><Camera/>Desativar privacidade</button></div>}
    {critical&&<div className="critical-confirmation" role="alertdialog" aria-label="Confirmar ação crítica"><ShieldCheck/><h3>Confirme a ação crítica</h3><p>Essa ação altera a segurança física da residência.</p><label>PIN de segurança<input autoFocus type="password" inputMode="numeric" autoComplete="one-time-code" value={pin} onChange={e=>setPin(e.target.value)} /></label><div><button className="secondary" onClick={()=>setCritical(null)}>Cancelar</button><button disabled={!pin.trim()||pending} className="critical-action" onClick={confirm}>Confirmar com PIN</button></div></div>}
    {!controls.size&&<div className="device-warning" role="status"><Info/>Este dispositivo não oferece controles compatíveis.</div>}<small className="panel-hint">Somente capacidades confirmadas pelo provedor são exibidas. O backend confirma o estado final.</small></div></div>
}

function ControlRange({label,value,onChange,onCommit,min=0,max=100,unit,disabled}){return <label>{label} <b>{value}{unit}</b><input disabled={disabled} type="range" min={min} max={max} value={value} onChange={e=>onChange(e.target.value)} onPointerUp={onCommit} onKeyUp={onCommit}/></label>}

function AddDevice({apiBase,close,saved,rooms}) { const [form,setForm]=useState({name:'',room:rooms[0]?.name||'Sala',type:'light',x:50,y:50}); const [error,setError]=useState(''); async function submit(e){e.preventDefault();const r=await fetch(`${apiBase}/devices`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await r.json();if(!r.ok)return setError(data.message||data.error);saved(data)} return <div className="overlay"><form className="panel" onSubmit={submit}><button type="button" className="close" onClick={close}><X/></button><h2>Adicionar ponto</h2><p>Cadastre um aparelho na sua planta.</p>{error&&<div className="form-error">{error}</div>}<label>Nome<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Luz da varanda"/></label><label>Ambiente<select value={form.room} onChange={e=>setForm({...form,room:e.target.value})}>{rooms.map(room=><option key={room.id}>{room.name}</option>)}</select></label><label>Tipo<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="light">Iluminação</option><option value="ac">Ar-condicionado</option><option value="tv">Televisão</option><option value="plug">Tomada</option></select></label><button className="primary" type="submit">Adicionar à planta</button></form></div> }

function RoomManager({apiBase,rooms,changed,close}) {
  const [name,setName]=useState(''); const [error,setError]=useState(''); const [editing,setEditing]=useState(null); const [editName,setEditName]=useState('');
  async function add(e){e.preventDefault();const r=await fetch(`${apiBase}/rooms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});const data=await r.json();if(!r.ok)return setError(data.message||data.error);changed([...rooms,data]);setName('');setError('')}
  async function rename(room){const clean=editName.trim();if(!clean)return;const r=await fetch(`${apiBase}/rooms/${room.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:clean,version:room.version})});const data=await r.json();if(!r.ok)return setError(data.message||data.error);changed(rooms.map(item=>item.id===room.id?data:item));setEditing(null);setError('')}
  async function reorder(index,direction){const next=[...rooms];const target=index+direction;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];const r=await fetch(`${apiBase}/rooms/order`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:next.map(room=>room.id)})});const data=await r.json();if(r.ok)changed(data);else setError(data.message||data.error)}
  async function remove(room){if(!window.confirm(`Excluir o cômodo “${room.name}”?`))return;const r=await fetch(`${apiBase}/rooms/${room.id}?version=${room.version}`,{method:'DELETE'});if(!r.ok){const data=await r.json();return setError(data.message||data.error)}changed(rooms.filter(item=>item.id!==room.id));setError('')}
  return <div className="overlay"><div className="panel room-manager" role="dialog" aria-modal="true" aria-label="Organizar cômodos"><button aria-label="Fechar" className="close" onClick={close}><X/></button><h2>Organizar cômodos</h2><p>Crie, renomeie e escolha a ordem dos ambientes.</p>{error&&<div className="form-error">{error}</div>}<form className="room-add" onSubmit={add}><input required maxLength="40" value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do novo cômodo"/><button className="primary"><Plus/> Criar</button></form><div className="room-list">{rooms.map((room,index)=><div key={room.id}>{editing===room.id?<form className="inline-edit" onSubmit={e=>{e.preventDefault();rename(room)}}><input autoFocus maxLength="40" value={editName} onChange={e=>setEditName(e.target.value)}/><button className="save-room">Salvar</button><button type="button" onClick={()=>setEditing(null)}>Cancelar</button></form>:<><span><b>{index+1}</b>{room.name}</span><div><button aria-label={`Editar ${room.name}`} onClick={()=>{setEditing(room.id);setEditName(room.name)}}><Pencil/></button><button aria-label={`Mover ${room.name} para cima`} disabled={index===0} onClick={()=>reorder(index,-1)}><ArrowUp/></button><button aria-label={`Mover ${room.name} para baixo`} disabled={index===rooms.length-1} onClick={()=>reorder(index,1)}><ArrowDown/></button><button aria-label={`Excluir ${room.name}`} className="danger" onClick={()=>remove(room)}><Trash2/></button></div></>}</div>)}</div></div></div>
}

function SettingsView({status,connection,deviceCount,lastSync,reload,notify,home}) { return <div className="settings-page"><section><div className="settings-heading"><span><Wifi/></span><div><h2>Dispositivos conectados</h2><p>Resumo das integrações da residência.</p></div></div><div className="setting-row"><span>Status</span><b className={connection==='error'?'bad':status.mode==='demo'?'warn':'good'}>{connection==='error'?'Falha na conexão':status.mode==='demo'?'Modo demonstração':'Integrações configuradas'}</b></div><div className="setting-row"><span>Dispositivos encontrados</span><b>{deviceCount}</b></div><div className="setting-row"><span>Atualização do painel</span><b>{lastSync?lastSync.toLocaleString('pt-BR'):'Ainda não atualizado'}</b></div></section><section><div className="settings-heading"><span><Sparkles/></span><div><h2>Assistente inteligente</h2><p>Interpretação de comandos por voz e texto.</p></div></div><div className="setting-row"><span>Comandos locais</span><b className="good">Ativos</b></div><div className="setting-row"><span>OpenAI</span><b className={status.ai?'good':'warn'}>{status.ai?'Configurada':'Opcional, não configurada'}</b></div><p className="privacy-note">As credenciais ficam somente no servidor e nunca são enviadas ao navegador.</p></section>{home&&<VaultSettings home={home} notify={notify} reload={reload}/>}</div> }

function VaultSettings({home,notify,reload}){const [saved,setSaved]=useState([]);const [provider,setProvider]=useState('tuya');const [busy,setBusy]=useState('');const [tuya,setTuya]=useState({accessId:'',accessSecret:'',region:'us'});const [ha,setHa]=useState({baseUrl:'',token:''});const load=()=>fetch(`/api/v1/homes/${home.id}/integrations`).then(r=>r.json()).then(setSaved);useEffect(()=>{load()},[home.id]);const configured=name=>saved.find(item=>item.provider===name);async function submit(e){e.preventDefault();setBusy('save');const credentials=provider==='tuya'?tuya:ha;try{const r=await fetch(`/api/v1/homes/${home.id}/integrations/${provider}/credentials`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({credentials})});const data=await r.json();if(!r.ok)throw new Error(data.message||data.error);provider==='tuya'?setTuya({accessId:'',accessSecret:'',region:'us'}):setHa({baseUrl:'',token:''});await load();notify('Credenciais criptografadas e armazenadas.','success')}catch(error){notify(error.message,'error')}finally{setBusy('')}}async function action(kind){setBusy(kind);try{const r=await fetch(`/api/v1/homes/${home.id}/integrations/${provider}/${kind}`,{method:kind==='sync'?'POST':'GET'});const data=await r.json();if(!r.ok)throw new Error(data.message||data.error);if(kind==='sync'){await load();await reload('integrated');notify(`${data.total} dispositivo(s): ${data.created} novo(s), ${data.updated} atualizado(s).`,'success')}else notify(`Conexão ${provider==='tuya'?'Tuya':'Home Assistant'} operacional.`,'success')}catch(error){notify(error.message,'error')}finally{setBusy('')}}const current=configured(provider);return <section><div className="settings-heading"><span><LockKeyhole/></span><div><h2>Integrações e cofre</h2><p>AES-256-GCM · associado a {home.name}</p></div></div><div className="integration-tabs" role="tablist"><button role="tab" aria-selected={provider==='tuya'} className={provider==='tuya'?'active':''} onClick={()=>setProvider('tuya')}>Tuya / Ekaza</button><button role="tab" aria-selected={provider==='home-assistant'} className={provider==='home-assistant'?'active':''} onClick={()=>setProvider('home-assistant')}>Home Assistant</button></div><div className="setting-row"><span>Status</span><b className={current?'good':'warn'}>{current?.status==='connected'?'Conectada':current?'Protegida':'Não cadastrada'}</b></div>{current?.lastSyncAt&&<div className="setting-row"><span>Última sincronização</span><b>{new Date(current.lastSyncAt).toLocaleString('pt-BR')}</b></div>}<form className="vault-form" onSubmit={submit}>{provider==='tuya'?<><label>Access ID<input required autoComplete="off" value={tuya.accessId} onChange={e=>setTuya({...tuya,accessId:e.target.value})}/></label><label>Access Secret<input required type="password" autoComplete="new-password" value={tuya.accessSecret} onChange={e=>setTuya({...tuya,accessSecret:e.target.value})}/></label><label>Região<select value={tuya.region} onChange={e=>setTuya({...tuya,region:e.target.value})}><option value="us">Western America</option><option value="eu">Europa</option><option value="in">Índia</option><option value="cn">China</option></select></label></>:<><label>URL do Home Assistant<input required type="url" placeholder="https://home.exemplo.com" value={ha.baseUrl} onChange={e=>setHa({...ha,baseUrl:e.target.value})}/></label><label>Long-Lived Access Token<input required type="password" autoComplete="new-password" value={ha.token} onChange={e=>setHa({...ha,token:e.target.value})}/></label></>}<button disabled={Boolean(busy)} className="primary">{busy==='save'?'Salvando...':current?'Rotacionar credencial':'Salvar no cofre'}</button></form><div className="setting-actions"><button disabled={!current||Boolean(busy)} className="secondary" onClick={()=>action('health')}>{busy==='health'?<RefreshCw className="spin"/>:<Wifi/>} Testar</button><button disabled={!current||Boolean(busy)} className="primary" onClick={()=>action('sync')}>{busy==='sync'?<RefreshCw className="spin"/>:<RefreshCw/>} Sincronizar</button></div><p className="privacy-note">Os valores nunca podem ser consultados pela interface. Para trocar, grave uma nova credencial.</p></section>}

function AuthGate(){const [session,setSession]=useState({loading:true,user:null,home:null});async function establish(user){let r=await fetch('/api/v1/homes');let homes=await r.json();if(!homes.length){r=await fetch('/api/v1/homes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Minha casa'})});homes=[await r.json()];}setSession({loading:false,user,home:homes[0]});}useEffect(()=>{(async()=>{if(new URLSearchParams(window.location.search).has('reset'))return setSession({loading:false,user:null,home:null});let r=await fetch('/api/v1/me');if(r.status===401){await fetch('/api/v1/auth/refresh',{method:'POST'});r=await fetch('/api/v1/me');}if(r.ok)establish(await r.json());else setSession({loading:false,user:null,home:null});})()},[]);if(session.loading)return <div className="auth-loading"><Sparkles/><span>Preparando sua casa...</span></div>;if(!session.user)return <AuthScreen authenticated={establish}/>;return <App user={session.user} home={session.home} onLogout={async()=>{await fetch('/api/v1/auth/logout',{method:'POST'});setSession({loading:false,user:null,home:null})}}/>}

function AuthScreen({authenticated}){
  const resetToken=new URLSearchParams(window.location.search).get('reset');
  const [mode,setMode]=useState(resetToken?'reset':'login');
  const [form,setForm]=useState({displayName:'',email:'',password:'',confirmation:''});
  const [feedback,setFeedback]=useState({type:'',text:''});
  const [busy,setBusy]=useState(false);
  const [captcha,setCaptcha]=useState({enabled:false,ready:true,token:''});
  const [challengeKey,setChallengeKey]=useState(0);
  const action=mode==='forgot'?'password-recovery':mode==='reset'?'password-reset':mode;
  const content={login:['Bem-vindo de volta','Entre para controlar sua casa com segurança.'],register:['Crie sua casa digital','Sua conta protege dispositivos, rotinas e credenciais.'],forgot:['Recupere seu acesso','Informe seu e-mail. Se existir uma conta, enviaremos um link seguro.'],reset:['Crie uma nova senha','O link funciona uma única vez e sua nova senha encerrará as sessões anteriores.']}[mode];
  function changeMode(next){setMode(next);setFeedback({type:'',text:''});setCaptcha(value=>({...value,token:''}));setChallengeKey(value=>value+1)}
  async function submit(event){
    event.preventDefault();
    if(captcha.enabled&&!captcha.token)return setFeedback({type:'error',text:'Conclua a verificação anti-bot.'});
    if(mode==='reset'&&form.password!==form.confirmation)return setFeedback({type:'error',text:'As senhas precisam ser iguais.'});
    setBusy(true);setFeedback({type:'',text:''});
    try{
      const endpoint=mode==='forgot'?'password/forgot':mode==='reset'?'password/reset':mode;
      const payload=mode==='forgot'?{email:form.email,turnstileToken:captcha.token}:mode==='reset'?{token:resetToken,password:form.password,turnstileToken:captcha.token}:{displayName:form.displayName,email:form.email,password:form.password,turnstileToken:captcha.token};
      const response=await fetch(`/api/v1/auth/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data=response.status===204?{}:await response.json();
      if(!response.ok)throw new Error(data.message||'Não foi possível concluir a operação.');
      if(mode==='forgot')setFeedback({type:'success',text:data.message});
      else if(mode==='reset'){window.history.replaceState({},'',window.location.pathname);setFeedback({type:'success',text:'Senha alterada. Entre novamente com sua nova senha.'});setMode('login');setForm(value=>({...value,password:'',confirmation:''}));}
      else await authenticated(data.user);
    }catch(error){setFeedback({type:'error',text:error.message});setChallengeKey(value=>value+1)}finally{setBusy(false)}
  }
  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title"><div className="auth-brand"><span><Home/></span><b>Ninho</b></div><div><small>CASA INTELIGENTE, COM PRIVACIDADE</small><h1 id="auth-title">{content[0]}</h1><p>{content[1]}</p></div><form onSubmit={submit}>{mode==='register'&&<label>Seu nome<input autoComplete="name" required value={form.displayName} onChange={event=>setForm({...form,displayName:event.target.value})}/></label>}{mode!=='reset'&&<label>E-mail<input type="email" autoComplete="email" required value={form.email} onChange={event=>setForm({...form,email:event.target.value})}/></label>}{!['forgot'].includes(mode)&&<label>{mode==='reset'?'Nova senha':'Senha'}<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength="10" required value={form.password} onChange={event=>setForm({...form,password:event.target.value})}/></label>}{mode==='reset'&&<label>Confirme a nova senha<input type="password" autoComplete="new-password" minLength="10" required value={form.confirmation} onChange={event=>setForm({...form,confirmation:event.target.value})}/></label>}<TurnstileWidget key={`${action}-${challengeKey}`} action={action} changed={setCaptcha}/>{feedback.text&&<div role={feedback.type==='error'?'alert':'status'} className={feedback.type==='error'?'form-error':'form-success'}>{feedback.text}</div>}<button className="primary" disabled={busy||!captcha.ready}>{busy?'Aguarde...':mode==='register'?'Criar conta segura':mode==='forgot'?'Enviar link seguro':mode==='reset'?'Salvar nova senha':'Entrar'}</button></form><div className="auth-options">{mode==='login'&&<><button onClick={()=>changeMode('forgot')}>Esqueci minha senha</button><button onClick={()=>changeMode('register')}>Criar minha conta</button></>}{mode==='register'&&<button onClick={()=>changeMode('login')}>Já tenho uma conta</button>}{mode==='forgot'&&<button onClick={()=>changeMode('login')}>Voltar para o login</button>}{mode==='reset'&&<button onClick={()=>changeMode('login')}>Cancelar redefinição</button>}</div><div className="auth-security"><LockKeyhole/><span>Sessão HttpOnly · AES-256-GCM · proteção anti-bot</span></div></section></main>
}

let turnstileScript;
function loadTurnstile(){if(window.turnstile)return Promise.resolve();if(turnstileScript)return turnstileScript;turnstileScript=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar a proteção anti-bot.'));document.head.appendChild(script)});return turnstileScript;}
function TurnstileWidget({action,changed}){const container=React.useRef(null);useEffect(()=>{let active=true;let widgetId;(async()=>{try{const response=await fetch('/api/v1/auth/config');const config=await response.json();if(!active)return;if(!config.enabled){changed({enabled:false,ready:true,token:''});return}changed({enabled:true,ready:false,token:''});await loadTurnstile();if(!active)return;widgetId=window.turnstile.render(container.current,{sitekey:config.siteKey,theme:'dark',action,callback:token=>changed({enabled:true,ready:true,token}),'expired-callback':()=>changed({enabled:true,ready:false,token:''}),'error-callback':()=>{changed({enabled:true,ready:false,token:''});return true}});}catch{if(active)changed({enabled:true,ready:false,token:''})}})();return()=>{active=false;if(widgetId!==undefined&&window.turnstile)window.turnstile.remove(widgetId)}},[action]);return <div className="turnstile-box" ref={container} aria-label="Verificação anti-bot"/>}

createRoot(document.getElementById('root')).render(<AuthGate/>);
