import { errors } from '../core/app-error.js';

const allowed = ['name', 'room', 'type', 'online', 'power', 'brightness', 'temperature', 'x', 'y'];

export function validateDevicePatch(body) {
  const patch = Object.fromEntries(Object.entries(body || {}).filter(([key]) => allowed.includes(key)));
  for (const key of ['x', 'y', 'brightness']) {
    if (patch[key] !== undefined && (!Number.isFinite(patch[key]) || patch[key] < 0 || patch[key] > 100)) throw errors.validation(`${key} deve estar entre 0 e 100.`, { field: key });
  }
  if (patch.temperature !== undefined && (!Number.isFinite(patch.temperature) || patch.temperature < 16 || patch.temperature > 30)) throw errors.validation('temperature deve estar entre 16 e 30.', { field: 'temperature' });
  return patch;
}
