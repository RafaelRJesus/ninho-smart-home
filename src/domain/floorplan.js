export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function normalizeFloorplanPoint({ clientX, clientY, rect, pan, zoom }) {
  return {
    x: clamp(((clientX - rect.left - pan.x) / zoom) / rect.width * 100, 2, 98),
    y: clamp(((clientY - rect.top - pan.y) / zoom) / rect.height * 100, 3, 97)
  };
}

export function normalizeZoom(value) { return clamp(value, .6, 2.5); }

export function pinchZoom(initialZoom,initialDistance,currentDistance){
  if(!Number.isFinite(initialDistance)||initialDistance<=0||!Number.isFinite(currentDistance))return normalizeZoom(initialZoom);
  return normalizeZoom(initialZoom*(currentDistance/initialDistance));
}

export function defaultRoomGeometry(index,total){
  const columns=total<=2?2:Math.ceil(Math.sqrt(total));const rows=Math.ceil(total/columns);const gap=2;
  const width=(100-gap*(columns+1))/columns;const height=(100-gap*(rows+1))/rows;
  return {x:gap+(index%columns)*(width+gap),y:gap+Math.floor(index/columns)*(height+gap),width,height};
}

export function moveRoomGeometry(geometry,deltaX,deltaY){
  return {...geometry,x:clamp(geometry.x+deltaX,0,100-geometry.width),y:clamp(geometry.y+deltaY,0,100-geometry.height)};
}

export function resizeRoomGeometry(geometry,deltaX,deltaY){
  return {...geometry,width:clamp(geometry.width+deltaX,5,100-geometry.x),height:clamp(geometry.height+deltaY,5,100-geometry.y)};
}

export function deviceLayerMetric(device,layer){
  if(layer==='temperature'&&Number.isFinite(Number(device.temperature)))return `${Number(device.temperature)}°C`;
  if(layer==='energy'&&['plug','light','ac','tv'].includes(device.type))return device.power?'Em consumo':'Sem consumo';
  if(layer==='cameras'&&device.type==='camera')return device.online?'Câmera online':'Câmera offline';
  if(layer==='security'&&['lock','cover','camera'].includes(device.type))return device.type==='lock'?(device.locked?'Trancada':'Destrancada'):'Segurança';
  return null;
}
