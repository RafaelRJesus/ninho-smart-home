import type { CommandReceipt, Device, DeviceCommand } from './device.js';

export interface DeviceRepository {
  findById(homeId: string, deviceId: string): Promise<Device | null>;
  findByExternalId(integrationId: string, externalId: string): Promise<Device | null>;
  listByHome(homeId: string): Promise<Device[]>;
  upsert(device: Device): Promise<Device>;
}

export interface CommandRepository {
  findByRequestId(requestId: string): Promise<CommandReceipt | null>;
  createPending(command: DeviceCommand): Promise<CommandReceipt>;
  updateStatus(requestId: string, status: CommandReceipt['status']): Promise<CommandReceipt>;
}
