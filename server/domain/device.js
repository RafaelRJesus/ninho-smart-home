import { AppError, errors } from '../core/app-error.js';

const controlKeys = ['power', 'brightness', 'temperature', 'color', 'volume', 'mediaAction', 'locked', 'position', 'cameraAction'];
const allowed = ['name', 'room', 'type', 'online', 'capabilities', ...controlKeys, 'x', 'y'];
const mediaActions = new Set(['play', 'pause', 'stop', 'mute', 'unmute', 'channel_up', 'channel_down']);
const cameraActions = new Set(['privacy_on', 'privacy_off']);
const defaults = {
  light:['power','brightness','color'], ac:['power','temperature'], tv:['power','volume','mediaAction'],
  lock:['locked'], cover:['position'], camera:['cameraAction'], plug:['power']
};

export const deviceControls = patch => Object.fromEntries(Object.entries(patch).filter(([key]) => controlKeys.includes(key)));

export const deviceCapabilityCodes = device => {
  const declared=(device?.capabilities||[]).filter(item=>item.writable!==false).map(item=>item.code);
  return new Set(declared.length?declared:(defaults[device?.type]||[]));
};

export function ensureSupportedControls(device, controls) {
  const supported=deviceCapabilityCodes(device);
  for(const key of Object.keys(controls))if(!supported.has(key))throw new AppError('CAPABILITY_NOT_SUPPORTED',`O controle ${key} não é suportado pelo dispositivo.`,422);
}

export const isCriticalControl = (device,controls) =>
  (device?.type==='lock'&&controls.locked!==undefined)||(device?.type==='cover'&&controls.position!==undefined)||(device?.type==='camera'&&controls.cameraAction!==undefined);

export function ensureDeviceControllable(device, controls) {
  if (!Object.keys(controls).length) return;
  if (device?.status === 'error' || device?.error) throw new AppError('DEVICE_ERROR', 'O dispositivo está em erro e não pode receber comandos.', 409);
  if (device?.online === false || device?.status === 'offline') throw new AppError('DEVICE_OFFLINE', 'O dispositivo está offline e não pode receber comandos.', 409);
}

export function validateDevicePatch(body) {
  const patch = Object.fromEntries(Object.entries(body || {}).filter(([key]) => allowed.includes(key)));
  for (const key of ['x', 'y', 'brightness', 'volume', 'position']) {
    if (patch[key] !== undefined && (!Number.isFinite(patch[key]) || patch[key] < 0 || patch[key] > 100)) throw errors.validation(`${key} deve estar entre 0 e 100.`, { field: key });
  }
  if (patch.temperature !== undefined && (!Number.isFinite(patch.temperature) || patch.temperature < 16 || patch.temperature > 30)) throw errors.validation('temperature deve estar entre 16 e 30.', { field: 'temperature' });
  if (patch.color !== undefined && (typeof patch.color!=='string'||!/^#[0-9a-f]{6}$/i.test(patch.color))) throw errors.validation('color deve usar o formato hexadecimal #RRGGBB.', {field:'color'});
  if (patch.power !== undefined&&typeof patch.power!=='boolean')throw errors.validation('power deve ser booleano.',{field:'power'});
  if (patch.locked !== undefined&&typeof patch.locked!=='boolean')throw errors.validation('locked deve ser booleano.',{field:'locked'});
  if (patch.mediaAction !== undefined&&!mediaActions.has(patch.mediaAction))throw errors.validation('Ação de mídia inválida.',{field:'mediaAction'});
  if (patch.cameraAction !== undefined&&!cameraActions.has(patch.cameraAction))throw errors.validation('Ação de câmera inválida.',{field:'cameraAction'});
  if(patch.capabilities!==undefined&&!Array.isArray(patch.capabilities))throw errors.validation('capabilities deve ser uma lista.',{field:'capabilities'});
  return patch;
}
