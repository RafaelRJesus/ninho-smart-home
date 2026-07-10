import { useRef, useState } from 'react';
import { DoorOpen, Grid3X3, Lamp, Layers3, LocateFixed, Minus, Move, Plus, PlugZap, Thermometer, Tv, ZoomIn, ZoomOut } from 'lucide-react';
import { normalizeFloorplanPoint, normalizeZoom } from '../domain/floorplan.js';

const deviceIcons = { light: Lamp, ac: Thermometer, tv: Tv, plug: PlugZap };
function DeviceGlyph({ type }) { const Icon = deviceIcons[type] || PlugZap; return <Icon/>; }

function savedView() { try { return JSON.parse(sessionStorage.getItem('ninho-floorplan-view') || 'null'); } catch { return null; } }

export function FloorplanEditor({ mode, devices, rooms, update, select, add, manage }) {
  const saved = savedView();
  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState(saved?.zoom || 1);
  const [pan, setPan] = useState(saved?.pan || { x: 0, y: 0 });
  const [layers, setLayers] = useState({ rooms: true, devices: true, labels: true, grid: true });
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const gesture = useRef(null);
  const viewport = useRef(null);

  function persist(nextZoom, nextPan) { sessionStorage.setItem('ninho-floorplan-view', JSON.stringify({ zoom: nextZoom, pan: nextPan })); }
  function changeZoom(next) { const value=normalizeZoom(next);setZoom(value);persist(value,pan); }
  function resetView() { const next={x:0,y:0};setZoom(1);setPan(next);persist(1,next); }
  function startPan(event) {
    if (event.target.closest('.point') || event.target.closest('.room')) return;
    gesture.current={kind:'pan',pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,pan};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function startDevice(event, device) {
    if (!editing) return;
    event.stopPropagation();
    gesture.current={kind:'device',pointerId:event.pointerId,device};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const active=gesture.current;if(!active)return;
    if(active.kind==='pan'){active.latestPan={x:active.pan.x+event.clientX-active.startX,y:active.pan.y+event.clientY-active.startY};setPan(active.latestPan);}
    if(active.kind==='device'){
      const rect=viewport.current.getBoundingClientRect();
      active.position=normalizeFloorplanPoint({clientX:event.clientX,clientY:event.clientY,rect,pan,zoom});
    }
  }
  function end() {
    const active=gesture.current;if(!active)return;
    if(active.kind==='pan')persist(zoom,active.latestPan||pan);
    if(active.kind==='device'&&active.position)update(active.device.id,active.position);
    gesture.current=null;
  }
  function toggleLayer(key){setLayers(value=>({...value,[key]:!value[key]}));}

  return <section className="floorplan-editor">
    <div className="plant-toolbar"><div><b>{editing?'Modo edição':'Modo visualização'}</b><p>{editing?'Arraste os pontos; comandos estão bloqueados.':'Selecione um dispositivo para controlá-lo ou navegue pela planta.'}</p></div><div className="toolbar-actions"><button className={`secondary ${editing?'active':''}`} onClick={()=>setEditing(value=>!value)}><Move/> {editing?'Concluir edição':'Editar planta'}</button><button className="secondary" onClick={manage}><DoorOpen/> Cômodos</button><button className="primary" onClick={add}><Plus/> {mode==='tuya'?'Vincular':'Adicionar'}</button></div></div>
    <div className="floorplan-shell">
      <div className="floorplan-controls" aria-label="Controles da planta"><button aria-label="Aumentar zoom" onClick={()=>changeZoom(zoom+.2)}><ZoomIn/></button><button aria-label="Diminuir zoom" onClick={()=>changeZoom(zoom-.2)}><ZoomOut/></button><button aria-label="Centralizar planta" onClick={resetView}><LocateFixed/></button><button aria-label="Configurar camadas" className={layersOpen?'active':''} onClick={()=>setLayersOpen(value=>!value)}><Layers3/></button><output>{Math.round(zoom*100)}%</output></div>
      {layersOpen&&<div className="layer-panel"><b>Camadas</b>{[['rooms','Cômodos'],['devices','Dispositivos'],['labels','Nomes'],['grid','Grade']].map(([key,label])=><label key={key}><input type="checkbox" checked={layers[key]} onChange={()=>toggleLayer(key)}/>{key==='grid'&&<Grid3X3/>}{label}</label>)}</div>}
      <div ref={viewport} className={`floorplan-viewport ${editing?'editing':''}`} onPointerDown={startPan} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onWheel={event=>{event.preventDefault();changeZoom(zoom+(event.deltaY<0?.12:-.12));}}>
        <div className={`floorplan ${layers.grid?'show-grid':''}`} style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
          {layers.rooms&&<div className="room-grid">{rooms.map((room,index)=><button type="button" className={`room room-${index%8} ${selectedRoom===room.id?'selected':''}`} key={room.id} onClick={event=>{event.stopPropagation();setSelectedRoom(room.id)}}><div className="room-label">{layers.labels&&<><b>{room.name.toUpperCase()}</b><small>AMBIENTE {index+1}</small></>}</div><i className="window"/><i className="floor-door"/></button>)}</div>}
          {layers.devices&&devices.map(device=><button key={device.id} className={`point ${device.power?'on':'off'} ${!device.online?'offline':''} ${device.error?'error':''} ${editing?'movable':''}`} style={{left:`${device.x??50}%`,top:`${device.y??50}%`}} onPointerDown={event=>startDevice(event,device)} onClick={event=>{event.stopPropagation();if(!editing)select(device)}} aria-label={`${device.name}, ${!device.online?'offline':device.power?'ligado':'desligado'}`} aria-disabled={editing} title={editing?`Mover ${device.name}`:`Controlar ${device.name}`}><DeviceGlyph type={device.type}/>{layers.labels&&<span>{device.name}</span>}</button>)}
        </div>
      </div>
      <div className="floorplan-legend"><span className="on">Ligado</span><span className="off">Desligado</span><span className="offline">Offline</span><span className="error">Erro</span><small><Minus/> Arraste o fundo para navegar</small></div>
    </div>
  </section>;
}
