const defaults={light:['power','brightness','color'],ac:['power','temperature'],tv:['power','volume','mediaAction'],lock:['locked'],cover:['position'],camera:['cameraAction'],plug:['power']};

export function supportedControls(device){
  const declared=(device?.capabilities||[]).filter(item=>item.writable!==false).map(item=>item.code);
  return new Set(declared.length?declared:(defaults[device?.type]||[]));
}

export const isCriticalDeviceControl=(device,control)=>
  (device?.type==='lock'&&control==='locked')||(device?.type==='cover'&&control==='position')||(device?.type==='camera'&&control==='cameraAction');
