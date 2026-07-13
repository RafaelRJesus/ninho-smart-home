export const controlKeys=['power','brightness','temperature','color','volume','mediaAction','locked','position','cameraAction'];
export const isDeviceControl = patch => controlKeys.some(key => patch?.[key] !== undefined);

export function pendingDevice(device, patch, requestId) {
  return { ...device, ...patch, commandStatus: 'pending', commandRequestId: requestId, commandError: null };
}

export function confirmedDevice(device, requestId) {
  return { ...device, commandStatus: 'succeeded', commandRequestId: requestId, commandError: null };
}

export function failedDevice(device, requestId, message) {
  return { ...device, commandStatus: 'failed', commandRequestId: requestId, commandError: message };
}

export function deviceVisualStatus(device) {
  if (device?.commandStatus === 'pending') return 'pending';
  if (device?.commandStatus === 'failed' || device?.error || device?.status === 'error') return 'error';
  if (device?.online === false || device?.status === 'offline') return 'offline';
  return device?.power ? 'on' : 'off';
}

export const deviceStatusLabel = device => ({
  pending: 'aguardando confirmação',
  error: 'erro',
  offline: 'offline',
  on: 'ligado',
  off: 'desligado'
})[deviceVisualStatus(device)];
