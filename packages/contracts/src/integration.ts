import type { CommandReceipt, Device, DeviceCommand } from './device.js';

export interface ProviderHealth {
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
}

export interface DeviceEvent {
  correlationId: string;
  externalDeviceId: string;
  occurredAt: string;
  state: Record<string, unknown>;
}

export interface DeviceProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  listDevices(): Promise<Device[]>;
  getDeviceState(deviceId: string): Promise<Record<string, unknown>>;
  sendCommand(command: DeviceCommand): Promise<CommandReceipt>;
  subscribeToEvents(handler: (event: DeviceEvent) => Promise<void>): Promise<() => Promise<void>>;
  refreshCredentials(): Promise<void>;
  healthCheck(): Promise<ProviderHealth>;
}
