/**
 * Contrato interno para integrações. Adapters não devem vazar objetos do SDK.
 * @typedef {Object} DeviceProvider
 * @property {() => Promise<void>} connect
 * @property {() => Promise<void>} disconnect
 * @property {() => Promise<Array>} listDevices
 * @property {(deviceId:string) => Promise<Object>} getDeviceState
 * @property {(deviceId:string, commands:Array, requestId:string) => Promise<Object>} sendCommand
 * @property {(handler:Function) => Promise<Function>} subscribeToEvents
 * @property {() => Promise<void>} refreshCredentials
 * @property {() => Promise<Object>} healthCheck
 */

export const DEVICE_PROVIDER_METHODS = ['connect','disconnect','listDevices','getDeviceState','sendCommand','subscribeToEvents','refreshCredentials','healthCheck'];

export function assertDeviceProvider(provider) {
  const missing = DEVICE_PROVIDER_METHODS.filter(method => typeof provider?.[method] !== 'function');
  if (missing.length) throw new TypeError(`Adapter inválido. Métodos ausentes: ${missing.join(', ')}`);
  return provider;
}
