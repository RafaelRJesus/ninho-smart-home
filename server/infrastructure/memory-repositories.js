export class MemoryDeviceRepository {
  constructor(seed = []) { this.items = new Map(seed.map(item => [item.id, structuredClone(item)])); }
  async findById(homeId, deviceId) { const item = this.items.get(deviceId); return item?.homeId === homeId ? structuredClone(item) : null; }
  async findByExternalId(integrationId, externalId) { return structuredClone([...this.items.values()].find(item => item.integrationId === integrationId && item.externalId === externalId) || null); }
  async listByHome(homeId) { return [...this.items.values()].filter(item => item.homeId === homeId).map(item=>structuredClone(item)); }
  async upsert(device) { this.items.set(device.id, structuredClone(device)); return structuredClone(device); }
}

export class MemoryCommandRepository {
  constructor() { this.items = new Map(); }
  async findByRequestId(requestId) { return structuredClone(this.items.get(requestId) || null); }
  async createPending(command) { const receipt = { requestId: command.requestId, status: 'pending', acceptedAt: new Date().toISOString() }; this.items.set(command.requestId, receipt); return structuredClone(receipt); }
  async updateStatus(requestId, status) { const receipt = { ...this.items.get(requestId), status }; this.items.set(requestId, receipt); return structuredClone(receipt); }
}
