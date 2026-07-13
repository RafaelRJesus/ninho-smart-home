import {useEffect,useMemo,useRef,useState} from 'react';
import {DoorOpen,Expand,FileImage,Grid3X3,Lamp,Layers3,LocateFixed,Maximize2,Minus,Move,Plus,PlugZap,Thermometer,Trash2,Tv,Upload,ZoomIn,ZoomOut} from 'lucide-react';
import {normalizeFloorplanPoint,normalizeZoom,pinchZoom} from '../domain/floorplan.js';
import {deviceStatusLabel,deviceVisualStatus} from '../domain/device-command.js';

const deviceIcons={light:Lamp,ac:Thermometer,tv:Tv,plug:PlugZap};
function DeviceGlyph({type}){const Icon=deviceIcons[type]||PlugZap;return <Icon/>;}
function savedViews(){try{return JSON.parse(sessionStorage.getItem('ninho-floorplan-views')||'{}');}catch{return {};}}

export function FloorplanEditor({mode,devices,rooms,update,select,add,manage,apiBase,notify}){
  const [editing,setEditing]=useState(false);const [floors,setFloors]=useState([]);const [floorplan,setFloorplan]=useState({floors:{}});const [activeFloor,setActiveFloor]=useState('');
  const [floorState,setFloorState]=useState({loading:true,error:''});
  const [zoom,setZoom]=useState(1);const [pan,setPan]=useState({x:0,y:0});const [layers,setLayers]=useState({rooms:true,devices:true,labels:true,grid:true});
  const [layersOpen,setLayersOpen]=useState(false);const [selectedRoom,setSelectedRoom]=useState(null);const [fullScreen,setFullScreen]=useState(false);const [uploading,setUploading]=useState(false);
  const gesture=useRef(null);const pointers=useRef(new Map());const viewport=useRef(null);const shell=useRef(null);const fileInput=useRef(null);
  const floorRooms=useMemo(()=>rooms.filter(room=>room.floorId===activeFloor),[rooms,activeFloor]);
  const roomIds=useMemo(()=>new Set(floorRooms.map(room=>room.id)),[floorRooms]);
  const floorDevices=useMemo(()=>devices.filter(device=>roomIds.has(device.roomId)),[devices,roomIds]);
  const background=floorplan.floors?.[activeFloor]?.background;

  useEffect(()=>{setFloorState({loading:true,error:''});Promise.all([fetch(`${apiBase}/floors`).then(response=>{if(!response.ok)throw new Error();return response.json()}),fetch(`${apiBase}/floorplan`).then(response=>{if(!response.ok)throw new Error();return response.json()})]).then(([items,plan])=>{setFloors(items);setFloorplan(plan.content||{floors:{}});setActiveFloor(current=>current||items[0]?.id||'');setFloorState({loading:false,error:''});}).catch(()=>{setFloorState({loading:false,error:'Não foi possível carregar a planta.'});notify('Não foi possível carregar a planta.','error')});},[apiBase]);
  useEffect(()=>{const handler=()=>setFullScreen(document.fullscreenElement===shell.current);document.addEventListener('fullscreenchange',handler);return()=>document.removeEventListener('fullscreenchange',handler);},[]);
  useEffect(()=>{if(!activeFloor)return;const saved=savedViews()[activeFloor];setZoom(saved?.zoom||1);setPan(saved?.pan||{x:0,y:0});setSelectedRoom(null);},[activeFloor]);

  function persist(nextZoom,nextPan){if(!activeFloor)return;const values=savedViews();values[activeFloor]={zoom:nextZoom,pan:nextPan};sessionStorage.setItem('ninho-floorplan-views',JSON.stringify(values));}
  function changeZoom(next){const value=normalizeZoom(next);setZoom(value);persist(value,pan);}
  function resetView(){const next={x:0,y:0};setZoom(1);setPan(next);persist(1,next);}
  function startPan(event){
    if(event.target.closest('.point')||event.target.closest('.room'))return;
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* captura pode não existir em navegadores antigos */}
    if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];gesture.current={kind:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),zoom};return;}
    gesture.current={kind:'pan',pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,pan};
  }
  function startDevice(event,device){if(!editing)return;event.stopPropagation();gesture.current={kind:'device',pointerId:event.pointerId,device};try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* fallback mantém o clique funcional */}}
  function move(event){
    if(pointers.current.has(event.pointerId))pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});const active=gesture.current;if(!active)return;
    if(active.kind==='pinch'&&pointers.current.size>=2){const [a,b]=[...pointers.current.values()];const value=pinchZoom(active.zoom,active.distance,Math.hypot(a.x-b.x,a.y-b.y));active.latestZoom=value;setZoom(value);return;}
    if(active.kind==='pan'&&active.pointerId===event.pointerId){active.latestPan={x:active.pan.x+event.clientX-active.startX,y:active.pan.y+event.clientY-active.startY};setPan(active.latestPan);}
    if(active.kind==='device'){const rect=viewport.current.getBoundingClientRect();active.position=normalizeFloorplanPoint({clientX:event.clientX,clientY:event.clientY,rect,pan,zoom});}
  }
  function end(event){
    pointers.current.delete(event.pointerId);const active=gesture.current;if(!active)return;
    if(active.kind==='pinch'){persist(active.latestZoom||zoom,pan);if(pointers.current.size)gesture.current=null;else gesture.current=null;return;}
    if(active.pointerId!==event.pointerId)return;if(active.kind==='pan')persist(zoom,active.latestPan||pan);if(active.kind==='device'&&active.position)update(active.device.id,active.position);gesture.current=null;
  }
  function toggleLayer(key){setLayers(value=>({...value,[key]:!value[key]}));}
  async function toggleFullScreen(){if(!document.fullscreenElement){if(!shell.current?.requestFullscreen)return notify('Tela cheia não está disponível neste navegador.','info');await shell.current.requestFullscreen();}else await document.exitFullscreen();}
  async function saveFloorplan(next){const response=await fetch(`${apiBase}/floorplan`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});const result=await response.json();if(!response.ok)throw new Error(result.message||result.error);setFloorplan(result.content);}
  function upload(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(file.size>2*1024*1024)return notify('A planta deve ter no máximo 2 MB.','error');
    if(!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type))return notify('Use uma imagem PNG, JPEG, WebP ou SVG.','error');
    const reader=new FileReader();reader.onerror=()=>notify('Não foi possível ler o arquivo.','error');reader.onload=async()=>{setUploading(true);try{const next={floors:{...(floorplan.floors||{}),[activeFloor]:{background:{name:file.name,mime:file.type,dataUrl:reader.result}}}};await saveFloorplan(next);notify('Planta do piso atualizada.','success');}catch(error){notify(error.message,'error');}finally{setUploading(false)}};reader.readAsDataURL(file);
  }
  async function removeBackground(){setUploading(true);try{const next={floors:{...(floorplan.floors||{}),[activeFloor]:{background:null}}};await saveFloorplan(next);notify('Imagem da planta removida.','success');}catch(error){notify(error.message,'error');}finally{setUploading(false)}}

  return <section className="floorplan-editor">
    <div className="plant-toolbar"><div><b>{editing?'Modo edição':'Modo visualização'}</b><p>{editing?'Arraste os pontos; comandos estão bloqueados.':'Selecione um piso, navegue pela planta e escolha um ambiente.'}</p></div><div className="toolbar-actions"><button className={`secondary ${editing?'active':''}`} onClick={()=>setEditing(value=>!value)}><Move/> {editing?'Concluir edição':'Editar planta'}</button><button className="secondary" onClick={manage}><DoorOpen/> Cômodos</button><button className="primary" onClick={add}><Plus/> {mode==='tuya'?'Vincular':'Adicionar'}</button></div></div>
    <div className="floor-tabs" role="tablist" aria-label="Pisos da residência">{floors.map(floor=><button role="tab" aria-selected={activeFloor===floor.id} className={activeFloor===floor.id?'active':''} key={floor.id} onClick={()=>setActiveFloor(floor.id)}>{floor.name}</button>)}</div>
    <div ref={shell} className={`floorplan-shell ${fullScreen?'fullscreen':''}`}>
      <div className="floorplan-controls" aria-label="Controles da planta"><button aria-label="Aumentar zoom" onClick={()=>changeZoom(zoom+.2)}><ZoomIn/></button><button aria-label="Diminuir zoom" onClick={()=>changeZoom(zoom-.2)}><ZoomOut/></button><button aria-label="Centralizar planta" onClick={resetView}><LocateFixed/></button><button aria-label={fullScreen?'Sair da tela cheia':'Abrir em tela cheia'} onClick={toggleFullScreen}>{fullScreen?<Minus/>:<Maximize2/>}</button><button aria-label="Configurar camadas" className={layersOpen?'active':''} onClick={()=>setLayersOpen(value=>!value)}><Layers3/></button><output aria-live="polite">{Math.round(zoom*100)}%</output></div>
      <div className="floorplan-upload"><input ref={fileInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload}/><button disabled={!activeFloor||uploading} className="secondary" onClick={()=>fileInput.current?.click()}>{uploading?<Expand className="spin"/>:<Upload/>}{background?'Trocar planta':'Enviar planta'}</button>{background&&<button disabled={uploading} className="secondary danger" aria-label="Remover imagem da planta" onClick={removeBackground}><Trash2/></button>}</div>
      {layersOpen&&<div className="layer-panel"><b>Camadas</b>{[['rooms','Cômodos'],['devices','Dispositivos'],['labels','Nomes'],['grid','Grade']].map(([key,label])=><label key={key}><input type="checkbox" checked={layers[key]} onChange={()=>toggleLayer(key)}/>{key==='grid'&&<Grid3X3/>}{label}</label>)}</div>}
      <div ref={viewport} className={`floorplan-viewport ${editing?'editing':''}`} onPointerDown={startPan} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onWheel={event=>{event.preventDefault();changeZoom(zoom+(event.deltaY<0?.12:-.12));}}>
        <div className={`floorplan ${layers.grid?'show-grid':''} ${background?'has-background':''}`} style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
          {floorState.loading&&<div className="floorplan-fetch-state" role="status"><Expand className="spin"/><b>Carregando planta...</b></div>}
          {floorState.error&&<div className="floorplan-fetch-state error" role="alert"><FileImage/><b>{floorState.error}</b><small>Atualize a página para tentar novamente.</small></div>}
          {background&&<img className="floorplan-background" src={background.dataUrl} alt={`Planta ${background.name}`}/>}
          {!floorState.loading&&!floorState.error&&!background&&<div className="floorplan-placeholder"><FileImage/><b>Nenhuma imagem neste piso</b><small>Use “Enviar planta” para adicionar um fundo.</small></div>}
          {layers.rooms&&<div className="room-grid">{floorRooms.map((room,index)=><button type="button" className={`room room-${index%8} ${selectedRoom===room.id?'selected':''}`} key={room.id} onClick={event=>{event.stopPropagation();setSelectedRoom(room.id)}}><div className="room-label">{layers.labels&&<><b>{room.name.toUpperCase()}</b><small>AMBIENTE {index+1}</small></>}</div><i className="window"/><i className="floor-door"/></button>)}</div>}
          {layers.devices&&floorDevices.map(device=>{const visual=deviceVisualStatus(device);return <button key={device.id} data-status={visual} className={`point ${visual} ${editing?'movable':''}`} style={{left:`${device.x??50}%`,top:`${device.y??50}%`}} onPointerDown={event=>startDevice(event,device)} onClick={event=>{event.stopPropagation();if(!editing)select(device)}} aria-label={`${device.name}, ${deviceStatusLabel(device)}`} aria-busy={visual==='pending'} aria-disabled={editing} title={editing?`Mover ${device.name}`:`Controlar ${device.name}`}><DeviceGlyph type={device.type}/><i className="device-point-status" aria-hidden="true"/>{layers.labels&&<span>{device.name} · {deviceStatusLabel(device)}</span>}</button>})}
        </div>
      </div>
      <div className="floorplan-legend"><span className="on">Ligado</span><span className="off">Desligado</span><span className="offline">Offline</span><span className="error">Erro</span><small><Minus/> Arraste ou use dois dedos para navegar</small></div>
      {selectedRoom&&<div className="room-context" role="status"><DoorOpen/><span><small>Ambiente selecionado</small><b>{floorRooms.find(room=>room.id===selectedRoom)?.name}</b></span><button aria-label="Limpar seleção do ambiente" onClick={()=>setSelectedRoom(null)}>×</button></div>}
    </div>
  </section>;
}
