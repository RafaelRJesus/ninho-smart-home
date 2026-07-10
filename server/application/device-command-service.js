import { AppError } from '../core/app-error.js';

export class DeviceCommandService {
  constructor({ devices, commands, providers, audit }) {
    this.devices = devices;
    this.commands = commands;
    this.providers = providers;
    this.audit = audit;
  }

  async execute(command) {
    const existing = await this.commands.findByRequestId(command.requestId);
    if (existing) return existing;

    const device = await this.devices.findById(command.homeId, command.deviceId);
    if (!device) throw new AppError('DEVICE_NOT_FOUND', 'Dispositivo não encontrado.', 404);
    if (device.status === 'offline') throw new AppError('DEVICE_OFFLINE', 'O dispositivo está offline.', 409);

    const capability = device.capabilities.find(item => item.code === command.capability);
    if (!capability?.writable) throw new AppError('CAPABILITY_NOT_SUPPORTED', 'Controle não suportado pelo dispositivo.', 422);

    const provider = this.providers.get(device.integrationId);
    if (!provider) throw new AppError('INTEGRATION_UNAVAILABLE', 'Integração indisponível.', 503);

    await this.commands.createPending(command);
    try {
      const receipt = await provider.sendCommand(command);
      await this.commands.updateStatus(command.requestId, receipt.status);
      await this.audit?.record({ type: 'DEVICE_COMMAND', homeId: command.homeId, actorId: command.requestedBy, targetId: command.deviceId, requestId: command.requestId, result: receipt.status });
      return receipt;
    } catch (error) {
      await this.commands.updateStatus(command.requestId, 'failed');
      throw new AppError('PROVIDER_COMMAND_FAILED', 'O provedor não confirmou o comando.', 502);
    }
  }
}
