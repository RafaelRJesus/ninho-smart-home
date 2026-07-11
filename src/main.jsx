import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, LayoutDashboard, Map, Mic, Plus, Power, Send, Settings, Sparkles, Thermometer, Tv, Lamp, PlugZap, Wifi, WifiOff, X, RefreshCw, ArrowUp, ArrowDown, Trash2, DoorOpen, Pencil, Search, AlertCircle, CheckCircle2, Info, Clock, Moon, Sun, Workflow, LockKeyhole, LogOut } from 'lucide-react';
import { OperationalDashboard } from './components/OperationalDashboard.jsx';
import { FloorplanEditor } from './components/FloorplanEditor.jsx';
import { AutomationCenter } from './components/AutomationCenter.jsx';
import { useRealtime } from './hooks/useRealtime.js';
import './design-system/tokens.css';
import './styles.css';

const homeApi = homeId => `/api/v1/homes/${homeId}`;
const icons = { light: Lamp, ac: Thermometer, tv: Tv, plug: PlugZap };

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
  const [theme, setTheme] = useState(() => localStorage.getItem('ninho-theme') || 'dark');

  const receiveEvent = useCallback(event => {
    if (!event.type?.startsWith('device.')) return;
    const label = event.type === 'device.created' ? `${event.payload.name} foi adicionado` : `${event.payload.name} foi atualizado`;
    setActivity(items => [{ id: event.id, text: label, time: new Date(event.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...items].slice(0, 10));
    setDevices(items => items.map(device => device.id === event.payload.deviceId ? { ...device, ...event.payload, id: device.id } : device));
  }, []);
  const realtime = useRealtime(receiveEvent,`${API}/events`);

  function notify(text,type='info'){const id=Date.now()+Math.random();setToasts(items=>[...items,{id,text,type}]);setTimeout(()=>setToasts(items=>items.filter(item=>item.id!==id)),4500)}
  const load = async (mode=status.mode) => { setLoading(true); try { const r=await fetch(`${API}/devices`); const data=await r.json(); if(!r.ok)throw new Error(data.error||'Não foi possível carregar os dispositivos.'); setDevices(data);setConnection(mode==='demo'?'demo':'connected');setLastSync(new Date());return data } catch(error){setConnection('error');notify(error.message,'error');return []} finally{setLoading(false)} };
  const loadRooms = () => fetch(`${API}/rooms`).then(r => r.json()).then(setRooms);
  useEffect(() => { loadRooms(); fetch(`${API}/status`).then(r=>r.json()).then(data=>{setStatus(data);load(data.mode)}); }, []);
  useEffect(() => { document.documentElement.dataset.theme=theme; localStorage.setItem('ninho-theme',theme); }, [theme]);
  const active = devices.filter(d => d.power).length;
  const filteredDevices = devices.filter(device => (roomFilter==='Todos'||device.room===roomFilter) && `${device.name} ${device.room}`.toLowerCase().includes(query.toLowerCase()));
  const temperature = devices.find(d => d.type === 'ac')?.temperature;
  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toUpperCase();

  async function update(id, patch) {
    try {
      const r = await fetch(`${API}/devices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const changed = await r.json();
      if (!r.ok) throw new Error(changed.error);
      setDevices(ds => ds.map(d => d.id === id ? changed : d)); setSelected(current => current?.id === id ? changed : current);
      notify(`${changed.name}: alteração salva.`,'success');
    } catch (error) { notify(error.message,'error'); }
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
        <button aria-label="Visão geral" className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}><LayoutDashboard/> <span>Visão geral</span></button>
        <button aria-label="Minha planta" className={view === 'plant' ? 'active' : ''} onClick={() => setView('plant')}><Map/> <span>Minha planta</span></button>
        <button aria-label="Rotinas" className={view === 'routines' ? 'active' : ''} onClick={() => setView('routines')}><Workflow/> <span>Rotinas</span></button>
        <button aria-label="Configurações" className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}><Settings/> <span>Configurações</span></button>
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
        <OperationalDashboard devices={devices} connection={connection} realtime={realtime} activity={activity}/>
        <div className="section-title"><div><h2>Seus dispositivos</h2><p>{lastSync?`Atualizado às ${lastSync.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Controle rápido dos seus aparelhos'}</p></div><button className="link" onClick={()=>setView('plant')}>Ver na planta →</button></div>
        <div className="device-tools"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar dispositivo..."/></label><div className="room-filters"><button className={roomFilter==='Todos'?'active':''} onClick={()=>setRoomFilter('Todos')}>Todos</button>{rooms.map(room=><button key={room.id} className={roomFilter===room.name?'active':''} onClick={()=>setRoomFilter(room.name)}>{room.name}</button>)}</div></div>
        {loading?<DeviceSkeleton/>:filteredDevices.length?<div className="devices">{filteredDevices.map(d=><DeviceCard key={d.id} d={d} update={update} select={setSelected}/>)}</div>:<EmptyState hasQuery={Boolean(query||roomFilter!=='Todos')} clear={()=>{setQuery('');setRoomFilter('Todos')}} sync={load}/>} 
      </>}

      {view === 'plant' && <FloorplanEditor mode={status.mode} devices={devices} rooms={rooms} update={update} select={setSelected} add={()=>status.mode==='tuya'?notify('Adicione o aparelho no Smart Life e clique em Sincronizar.','info'):setAdding(true)} manage={()=>setManagingRooms(true)}/>} 
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

function DeviceCard({d,update,select}) { return <article role="button" tabIndex="0" aria-label={`Abrir ${d.name}`} className={`device ${d.power?'on':''} ${!d.online?'unavailable':''}`} onClick={()=>select(d)} onKeyDown={e=>(e.key==='Enter'||e.key===' ')&&select(d)}><div className="device-top"><span><DeviceIcon type={d.type}/></span><button aria-label={`${d.power?'Desligar':'Ligar'} ${d.name}`} aria-pressed={d.power} disabled={!d.online} className={`switch ${d.power?'on':''}`} onClick={e=>{e.stopPropagation();update(d.id,{power:!d.power})}}><i/></button></div><h3>{d.name}</h3><p>{d.room}</p><div className="device-foot"><small className={d.online?'online':'offline'}>{d.online?<Wifi/>:<WifiOff/>}{d.online?'Online':'Offline'}</small><b>{d.power?'Ligado':'Desligado'}</b></div></article> }

function DevicePanel({d,rooms,update,close}) { const [value,setValue]=useState(d.type==='light'?(d.brightness||50):(d.temperature||23));const property=d.type==='light'?'brightness':'temperature';const commit=()=>update(d.id,{[property]:+value});return <div className="overlay" onClick={close}><div className="panel" role="dialog" aria-modal="true" aria-label={`Controle de ${d.name}`} onClick={e=>e.stopPropagation()}><button aria-label="Fechar" className="close" onClick={close}><X/></button><div className="big-icon"><DeviceIcon type={d.type} size={30}/></div><h2>{d.name}</h2><p>{d.room} · {d.online?'Online':'Offline'}</p>{!d.online&&<div className="device-warning"><WifiOff/>Este aparelho está offline. Os controles estão indisponíveis.</div>}<button disabled={!d.online} className={`power-button ${d.power?'on':''}`} onClick={()=>update(d.id,{power:!d.power})}><Power/> {d.power?'Desligar':'Ligar'}</button><label>Ambiente<select value={d.room} onChange={e=>update(d.id,{room:e.target.value})}>{rooms.map(room=><option key={room.id}>{room.name}</option>)}</select></label>{['light','ac'].includes(d.type)&&<label>{d.type==='light'?'Brilho':'Temperatura'} <b>{value}{d.type==='light'?'%':'°C'}</b><input disabled={!d.online} type="range" min={d.type==='light'?1:16} max={d.type==='light'?100:30} value={value} onChange={e=>setValue(e.target.value)} onPointerUp={commit} onKeyUp={commit}/></label>}<small className="panel-hint">As alterações são enviadas ao aparelho e podem levar alguns segundos.</small></div></div> }

function AddDevice({apiBase,close,saved,rooms}) { const [form,setForm]=useState({name:'',room:rooms[0]?.name||'Sala',type:'light',x:50,y:50}); const [error,setError]=useState(''); async function submit(e){e.preventDefault();const r=await fetch(`${apiBase}/devices`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await r.json();if(!r.ok)return setError(data.message||data.error);saved(data)} return <div className="overlay"><form className="panel" onSubmit={submit}><button type="button" className="close" onClick={close}><X/></button><h2>Adicionar ponto</h2><p>Cadastre um aparelho na sua planta.</p>{error&&<div className="form-error">{error}</div>}<label>Nome<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex: Luz da varanda"/></label><label>Ambiente<select value={form.room} onChange={e=>setForm({...form,room:e.target.value})}>{rooms.map(room=><option key={room.id}>{room.name}</option>)}</select></label><label>Tipo<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="light">Iluminação</option><option value="ac">Ar-condicionado</option><option value="tv">Televisão</option><option value="plug">Tomada</option></select></label><button className="primary" type="submit">Adicionar à planta</button></form></div> }

function RoomManager({apiBase,rooms,changed,close}) {
  const [name,setName]=useState(''); const [error,setError]=useState(''); const [editing,setEditing]=useState(null); const [editName,setEditName]=useState('');
  async function add(e){e.preventDefault();const r=await fetch(`${apiBase}/rooms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});const data=await r.json();if(!r.ok)return setError(data.message||data.error);changed([...rooms,data]);setName('');setError('')}
  async function rename(room){const clean=editName.trim();if(!clean)return;const r=await fetch(`${apiBase}/rooms/${room.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:clean})});const data=await r.json();if(!r.ok)return setError(data.message||data.error);changed(rooms.map(item=>item.id===room.id?data:item));setEditing(null);setError('')}
  async function reorder(index,direction){const next=[...rooms];const target=index+direction;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];const r=await fetch(`${apiBase}/rooms/order`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:next.map(room=>room.id)})});const data=await r.json();if(r.ok)changed(data);else setError(data.message||data.error)}
  async function remove(room){if(!window.confirm(`Excluir o cômodo “${room.name}”?`))return;const r=await fetch(`${apiBase}/rooms/${room.id}`,{method:'DELETE'});if(!r.ok){const data=await r.json();return setError(data.message||data.error)}changed(rooms.filter(item=>item.id!==room.id));setError('')}
  return <div className="overlay"><div className="panel room-manager" role="dialog" aria-modal="true" aria-label="Organizar cômodos"><button aria-label="Fechar" className="close" onClick={close}><X/></button><h2>Organizar cômodos</h2><p>Crie, renomeie e escolha a ordem dos ambientes.</p>{error&&<div className="form-error">{error}</div>}<form className="room-add" onSubmit={add}><input required maxLength="40" value={name} onChange={e=>setName(e.target.value)} placeholder="Nome do novo cômodo"/><button className="primary"><Plus/> Criar</button></form><div className="room-list">{rooms.map((room,index)=><div key={room.id}>{editing===room.id?<form className="inline-edit" onSubmit={e=>{e.preventDefault();rename(room)}}><input autoFocus maxLength="40" value={editName} onChange={e=>setEditName(e.target.value)}/><button className="save-room">Salvar</button><button type="button" onClick={()=>setEditing(null)}>Cancelar</button></form>:<><span><b>{index+1}</b>{room.name}</span><div><button aria-label={`Editar ${room.name}`} onClick={()=>{setEditing(room.id);setEditName(room.name)}}><Pencil/></button><button aria-label={`Mover ${room.name} para cima`} disabled={index===0} onClick={()=>reorder(index,-1)}><ArrowUp/></button><button aria-label={`Mover ${room.name} para baixo`} disabled={index===rooms.length-1} onClick={()=>reorder(index,1)}><ArrowDown/></button><button aria-label={`Excluir ${room.name}`} className="danger" onClick={()=>remove(room)}><Trash2/></button></div></>}</div>)}</div></div></div>
}

function SettingsView({status,connection,deviceCount,lastSync,reload,notify,home}) { const [testing,setTesting]=useState(false);async function testTuya(){setTesting(true);try{const r=await fetch(`/api/v1/homes/${home.id}/integrations/health`);const data=await r.json();if(!r.ok)throw new Error(data.message||data.error);notify(`Integrações verificadas: ${Object.keys(data).length}.`,'success')}catch(error){notify(error.message,'error')}finally{setTesting(false)}}return <div className="settings-page"><section><div className="settings-heading"><span><Wifi/></span><div><h2>Integração Tuya</h2><p>Conexão com os dispositivos da sua casa.</p></div></div><div className="setting-row"><span>Status</span><b className={connection==='connected'?'good':connection==='error'?'bad':'warn'}>{connection==='connected'?'Conectado':connection==='error'?'Falha na conexão':status.mode==='demo'?'Modo demonstração':'Verificando'}</b></div><div className="setting-row"><span>Dispositivos encontrados</span><b>{deviceCount}</b></div><div className="setting-row"><span>Última sincronização</span><b>{lastSync?lastSync.toLocaleString('pt-BR'):'Ainda não sincronizado'}</b></div><div className="setting-actions"><button disabled={testing} className="primary" onClick={testTuya}>{testing?<RefreshCw className="spin"/>:<Wifi/>} Testar conexão</button><button className="secondary" onClick={async()=>{await reload(status.mode);notify('Dispositivos sincronizados.','success')}}><RefreshCw/> Sincronizar</button></div></section><section><div className="settings-heading"><span><Sparkles/></span><div><h2>Assistente inteligente</h2><p>Interpretação de comandos por voz e texto.</p></div></div><div className="setting-row"><span>Comandos locais</span><b className="good">Ativos</b></div><div className="setting-row"><span>OpenAI</span><b className={status.ai?'good':'warn'}>{status.ai?'Configurada':'Opcional, não configurada'}</b></div><p className="privacy-note">As credenciais ficam somente no servidor e nunca são enviadas ao navegador.</p></section>{home&&<VaultSettings home={home} notify={notify}/>}</div> }

function VaultSettings({home,notify}){const [saved,setSaved]=useState([]);const [form,setForm]=useState({accessId:'',accessSecret:'',region:'us'});const load=()=>fetch(`/api/v1/homes/${home.id}/integrations`).then(r=>r.json()).then(setSaved);useEffect(()=>{load()},[home.id]);async function submit(e){e.preventDefault();const r=await fetch(`/api/v1/homes/${home.id}/integrations/tuya/credentials`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({credentials:form})});const data=await r.json();if(!r.ok)return notify(data.message||data.error,'error');setForm({accessId:'',accessSecret:'',region:'us'});await load();notify('Credenciais criptografadas e armazenadas.','success')}const configured=saved.find(item=>item.provider==='tuya');return <section><div className="settings-heading"><span><LockKeyhole/></span><div><h2>Cofre de credenciais</h2><p>AES-256-GCM · associado a {home.name}</p></div></div><div className="setting-row"><span>Tuya</span><b className={configured?'good':'warn'}>{configured?'Protegida':'Não cadastrada'}</b></div><form className="vault-form" onSubmit={submit}><label>Access ID<input required autoComplete="off" value={form.accessId} onChange={e=>setForm({...form,accessId:e.target.value})}/></label><label>Access Secret<input required type="password" autoComplete="new-password" value={form.accessSecret} onChange={e=>setForm({...form,accessSecret:e.target.value})}/></label><label>Região<select value={form.region} onChange={e=>setForm({...form,region:e.target.value})}><option value="us">Western America</option><option value="eu">Europa</option><option value="in">Índia</option><option value="cn">China</option></select></label><button className="primary">{configured?'Rotacionar credencial':'Salvar no cofre'}</button></form><p className="privacy-note">O valor salvo nunca pode ser consultado pela interface. Para trocar, grave uma nova credencial.</p></section>}

function AuthGate(){const [session,setSession]=useState({loading:true,user:null,home:null});async function establish(user){let r=await fetch('/api/v1/homes');let homes=await r.json();if(!homes.length){r=await fetch('/api/v1/homes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Minha casa'})});homes=[await r.json()];}setSession({loading:false,user,home:homes[0]});}useEffect(()=>{(async()=>{let r=await fetch('/api/v1/me');if(r.status===401){await fetch('/api/v1/auth/refresh',{method:'POST'});r=await fetch('/api/v1/me');}if(r.ok)establish(await r.json());else setSession({loading:false,user:null,home:null});})()},[]);if(session.loading)return <div className="auth-loading"><Sparkles/><span>Preparando sua casa...</span></div>;if(!session.user)return <AuthScreen authenticated={establish}/>;return <App user={session.user} home={session.home} onLogout={async()=>{await fetch('/api/v1/auth/logout',{method:'POST'});setSession({loading:false,user:null,home:null})}}/>}

function AuthScreen({authenticated}){const [registering,setRegistering]=useState(false);const [form,setForm]=useState({displayName:'',email:'',password:''});const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [captcha,setCaptcha]=useState({enabled:false,ready:true,token:''});const [challengeKey,setChallengeKey]=useState(0);async function submit(e){e.preventDefault();if(captcha.enabled&&!captcha.token)return setError('Conclua a verificação anti-bot.');setBusy(true);setError('');try{const r=await fetch(`/api/v1/auth/${registering?'register':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,turnstileToken:captcha.token})});const data=await r.json();if(!r.ok)throw new Error(data.message);await authenticated(data.user)}catch(err){setError(err.message);setChallengeKey(value=>value+1)}finally{setBusy(false)}}const changeMode=()=>{setRegistering(!registering);setError('');setCaptcha(value=>({...value,token:''}));setChallengeKey(value=>value+1)};return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span><Home/></span><b>Ninho</b></div><div><small>CASA INTELIGENTE, COM PRIVACIDADE</small><h1>{registering?'Crie sua casa digital':'Bem-vindo de volta'}</h1><p>{registering?'Sua conta protege dispositivos, rotinas e credenciais.':'Entre para controlar sua casa com segurança.'}</p></div><form onSubmit={submit}>{registering&&<label>Seu nome<input required value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})}/></label>}<label>E-mail<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Senha<input type="password" minLength="10" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><TurnstileWidget key={`${registering}-${challengeKey}`} action={registering?'register':'login'} changed={setCaptcha}/>{error&&<div className="form-error">{error}</div>}<button className="primary" disabled={busy||!captcha.ready}>{busy?'Aguarde...':registering?'Criar conta segura':'Entrar'}</button></form><button className="auth-switch" onClick={changeMode}>{registering?'Já tenho uma conta':'Criar minha conta'}</button><div className="auth-security"><LockKeyhole/><span>Sessão HttpOnly · AES-256-GCM · proteção anti-bot</span></div></section></main>}

let turnstileScript;
function loadTurnstile(){if(window.turnstile)return Promise.resolve();if(turnstileScript)return turnstileScript;turnstileScript=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar a proteção anti-bot.'));document.head.appendChild(script)});return turnstileScript;}
function TurnstileWidget({action,changed}){const container=React.useRef(null);useEffect(()=>{let active=true;let widgetId;(async()=>{try{const response=await fetch('/api/v1/auth/config');const config=await response.json();if(!active)return;if(!config.enabled){changed({enabled:false,ready:true,token:''});return}changed({enabled:true,ready:false,token:''});await loadTurnstile();if(!active)return;widgetId=window.turnstile.render(container.current,{sitekey:config.siteKey,theme:'dark',action,callback:token=>changed({enabled:true,ready:true,token}),'expired-callback':()=>changed({enabled:true,ready:false,token:''}),'error-callback':()=>{changed({enabled:true,ready:false,token:''});return true}});}catch{if(active)changed({enabled:true,ready:false,token:''})}})();return()=>{active=false;if(widgetId!==undefined&&window.turnstile)window.turnstile.remove(widgetId)}},[action]);return <div className="turnstile-box" ref={container} aria-label="Verificação anti-bot"/>}

createRoot(document.getElementById('root')).render(<AuthGate/>);
