import fs from 'node:fs';
import path from 'node:path';

const defaultState = {
  devices: [
    { id: 'luz-sala', name: 'Luz principal', room: 'Sala', type: 'light', online: true, power: true, brightness: 72, x: 25, y: 38 },
    { id: 'ar-sala', name: 'Ar-condicionado', room: 'Sala', type: 'ac', online: true, power: true, temperature: 23, x: 44, y: 19 },
    { id: 'tv-sala', name: 'Smart TV', room: 'Sala', type: 'tv', online: true, power: false, x: 12, y: 63 },
    { id: 'luz-quarto', name: 'Luz do quarto', room: 'Quarto', type: 'light', online: true, power: false, brightness: 48, x: 73, y: 37 },
    { id: 'tomada-cozinha', name: 'Cafeteira', room: 'Cozinha', type: 'plug', online: false, power: false, x: 29, y: 81 }
  ],
  layout: {},
  rooms: [
    { id: 'sala', name: 'Sala' }, { id: 'quarto', name: 'Quarto' },
    { id: 'cozinha', name: 'Cozinha' }, { id: 'banheiro', name: 'Banheiro' }
  ],
  scenes: [], automations: [], notifications: [], energyReadings: [], energySettings: { tariff: null, currency: 'BRL' }
};

export class Store {
  constructor(file = process.env.DATA_FILE || path.resolve('data/state.json')) {
    this.file = file;
    this.state = this.read();
  }

  read() {
    try { return { ...structuredClone(defaultState), ...JSON.parse(fs.readFileSync(this.file, 'utf8')) }; }
    catch { return structuredClone(defaultState); }
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(this.state, null, 2));
    fs.renameSync(temp, this.file);
  }

  get devices() { return this.state.devices; }
  get rooms() { return this.state.rooms; }
  get scenes() { return this.state.scenes; }
  get automations() { return this.state.automations; }
  get notifications() { return this.state.notifications; }
  get energyReadings() { return this.state.energyReadings; }
  get energySettings() { return this.state.energySettings; }
  layout(id) { return this.state.layout[id] || {}; }
  updateLayout(id, patch) { this.state.layout[id] = { ...this.layout(id), ...patch }; this.save(); }
  updateDevice(id, patch) { const found = this.devices.find(d => d.id === id); if (found) { Object.assign(found, patch); this.save(); } return found; }
  addDevice(device) { this.devices.push(device); this.save(); return device; }
  deleteDevice(id) { const index = this.devices.findIndex(d => d.id === id); if (index < 0) return false; this.devices.splice(index, 1); this.save(); return true; }
  addRoom(room) { this.rooms.push(room); this.save(); return room; }
  renameRoom(id, name) { const room = this.rooms.find(item => item.id === id); if (!room) return null; const previous = room.name; room.name = name; this.devices.forEach(device => { if (device.room === previous) device.room = name; }); Object.values(this.state.layout).forEach(item => { if (item.room === previous) item.room = name; }); this.save(); return room; }
  reorderRooms(ids) { this.state.rooms = ids.map(id => this.rooms.find(room => room.id === id)).filter(Boolean); this.save(); return this.rooms; }
  deleteRoom(id) { const index = this.rooms.findIndex(room => room.id === id); if (index < 0) return false; this.rooms.splice(index, 1); this.save(); return true; }
  upsertScene(scene) { const index=this.scenes.findIndex(item=>item.id===scene.id);if(index<0)this.scenes.push(scene);else this.scenes[index]=scene;this.save();return structuredClone(scene); }
  deleteScene(id) { const index=this.scenes.findIndex(item=>item.id===id);if(index<0)return false;this.scenes.splice(index,1);this.save();return true; }
  upsertAutomation(automation) { const index=this.automations.findIndex(item=>item.id===automation.id);if(index<0)this.automations.push(automation);else this.automations[index]=automation;this.save();return structuredClone(automation); }
  deleteAutomation(id) { const index=this.automations.findIndex(item=>item.id===id);if(index<0)return false;this.automations.splice(index,1);this.save();return true; }
  addNotification(notification) { this.notifications.unshift(notification);this.notifications.splice(200);this.save();return structuredClone(notification); }
  readNotification(id) { const found=this.notifications.find(item=>item.id===id);if(found){found.readAt=new Date().toISOString();this.save();}return found?structuredClone(found):null; }
  addEnergyReading(reading) { this.energyReadings.push(reading);this.save();return structuredClone(reading); }
  updateEnergySettings(patch) { this.state.energySettings={...this.energySettings,...patch};this.save();return structuredClone(this.energySettings); }
}
