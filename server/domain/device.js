import { AppError, errors } from '../core/app-error.js';

const allowed = ['name', 'room', 'type', 'online', 'power', 'brightness', 'temperature', 'x', 'y'];

export const deviceControls = patch => Object.fromEntries(Object.entries(patch).filter(([key]) => ['power', 'brightness', 'temperature'].includes(key)));

export function ensureDeviceControllable(device, controls) {
  if (!Object.keys(controls).length) return;
  if (device?.status === 'error' || device?.error) throw new AppError('DEVICE_ERROR', 'O dispositivo está em erro e não pode receber comandos.', 409);
  if (device?.online === false || device?.status === 'offline') throw new AppError('DEVICE_OFFLINE', 'O dispositivo está offline e não pode receber comandos.', 409);
}

export function validateDevicePatch(body) {
  const patch = Object.fromEntries(Object.entries(body || {}).filter(([key]) => allowed.includes(key)));
  for (const key of ['x', 'y', 'brightness']) {
    if (patch[key] !== undefined && (!Number.isFinite(patch[key]) || patch[key] < 0 || patch[key] > 100)) throw errors.validation(`${key} deve estar entre 0 e 100.`, { field: key });
  }
  if (patch.temperature !== undefined && (!Number.isFinite(patch.temperature) || patch.temperature < 16 || patch.temperature > 30)) throw errors.validation('temperature deve estar entre 16 e 30.', { field: 'temperature' });
  return patch;
}
