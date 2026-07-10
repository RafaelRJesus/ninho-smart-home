export type DeviceStatus = 'online' | 'offline' | 'error' | 'unknown';
export type CommandStatus = 'pending' | 'acknowledged' | 'succeeded' | 'failed' | 'timed_out';

export interface DeviceCapability {
  code: string;
  type: 'boolean' | 'integer' | 'decimal' | 'enum' | 'string';
  readable: boolean;
  writable: boolean;
  unit?: string;
  minimum?: number;
  maximum?: number;
  values?: string[];
}

export interface Device {
  id: string;
  homeId: string;
  roomId?: string;
  integrationId: string;
  externalId: string;
  name: string;
  category: string;
  status: DeviceStatus;
  capabilities: DeviceCapability[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCommand {
  requestId: string;
  homeId: string;
  deviceId: string;
  capability: string;
  value: unknown;
  requestedBy: string;
}

export interface CommandReceipt {
  requestId: string;
  status: CommandStatus;
  acceptedAt: string;
}
