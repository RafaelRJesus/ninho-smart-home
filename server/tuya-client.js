import crypto from 'node:crypto';

const hosts = {
  us: 'https://openapi.tuyaus.com',
  eu: 'https://openapi.tuyaeu.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com'
};

export class TuyaClient {
  constructor({ accessId, accessSecret, region = 'us' }) {
    this.id = accessId;
    this.secret = accessSecret;
    this.host = hosts[region.toLowerCase()] || hosts.us;
    this.token = null;
    this.expiresAt = 0;
  }

  hash(value = '') {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  sign(value) {
    return crypto.createHmac('sha256', this.secret).update(value).digest('hex').toUpperCase();
  }

  async request(method, path, body, withToken = true) {
    if (withToken) await this.ensureToken();
    const serialized = body === undefined ? '' : JSON.stringify(body);
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const stringToSign = `${method}\n${this.hash(serialized)}\n\n${path}`;
    const payload = `${this.id}${withToken ? this.token : ''}${timestamp}${nonce}${stringToSign}`;
    const response = await fetch(`${this.host}${path}`, {
      method,
      headers: {
        client_id: this.id,
        sign: this.sign(payload),
        sign_method: 'HMAC-SHA256',
        t: timestamp,
        nonce,
        ...(withToken ? { access_token: this.token } : {}),
        ...(serialized ? { 'Content-Type': 'application/json' } : {})
      },
      body: serialized || undefined
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.msg || `Erro Tuya ${response.status}`);
    return data.result;
  }

  async ensureToken() {
    if (this.token && Date.now() < this.expiresAt) return;
    const result = await this.request('GET', '/v1.0/token?grant_type=1', undefined, false);
    this.token = result.access_token;
    this.expiresAt = Date.now() + Math.max(60, result.expire_time - 120) * 1000;
  }

  async listDevices() {
    const devices = [];
    let lastId = '';
    for (let page = 0; page < 10; page += 1) {
      const path = `/v2.0/cloud/thing/device?page_size=20${lastId ? `&last_id=${encodeURIComponent(lastId)}` : ''}`;
      const result = await this.request('GET', path);
      const batch = result?.list || result?.devices || (Array.isArray(result) ? result : []);
      devices.push(...batch);
      if (batch.length < 20) break;
      lastId = batch.at(-1)?.id;
      if (!lastId) break;
    }
    return devices;
  }

  getStatus(deviceId) {
    return this.request('GET', `/v1.0/devices/${deviceId}/status`);
  }

  getFunctions(deviceId) {
    return this.request('GET', `/v1.0/devices/${deviceId}/functions`);
  }

  sendCommands(deviceId, commands) {
    return this.request('POST', `/v1.0/devices/${deviceId}/commands`, { commands });
  }

  async testConnection() {
    await this.ensureToken();
    const devices = await this.listDevices();
    return { connected: true, deviceCount: devices.length, host: this.host };
  }
}

export function statusValue(status, codes, fallback) {
  for (const code of codes) {
    const item = status?.find(entry => entry.code === code);
    if (item) return item.value;
  }
  return fallback;
}

export function normalizedStatusValue(status, functions, codes, fallback, property) {
  const entry=codes.map(code=>status?.find(item=>item.code===code)).find(Boolean);if(!entry)return fallback;
  const definition=functions?.find(item=>item.code===entry.code);let spec={};
  try{spec=typeof definition?.values==='string'?JSON.parse(definition.values):definition?.values||{};}catch{spec={};}
  const raw=Number(entry.value);if(!Number.isFinite(raw))return entry.value;
  if(property==='brightness'){
    const min=Number(spec.min??0);const max=Number(spec.max??100);if(max<=min)return raw;
    return Math.max(0,Math.min(100,Math.round((raw-min)/(max-min)*100)));
  }
  if(property==='temperature')return Number((raw/(10**Number(spec.scale||0))).toFixed(1));
  return raw;
}

export function inferType(category = '', functions = []) {
  const codes = functions.map(item => item.code);
  if (codes.some(code => /unlock|lock_motor|switch_lock/.test(code)) || /ms|jtms/.test(category)) return 'lock';
  if (codes.some(code => /percent_control|position/.test(code)) || /cl|ckmkzq/.test(category)) return 'cover';
  if (codes.some(code => /basic_private|ipc/.test(code)) || /sp|ipc/.test(category)) return 'camera';
  if (codes.some(code => /temp_set|temp_current/.test(code)) || /kt|wk/.test(category)) return 'ac';
  if (codes.some(code => /bright|colour|switch_led/.test(code)) || /dj|xdd|fwl/.test(category)) return 'light';
  if (/tv|ykq/.test(category)) return 'tv';
  return 'plug';
}

export function commandFor(functions, property, value) {
  const codes = functions.map(item => item.code);
  const aliases={power:['switch_led','switch_1','switch','switch_power','power'],brightness:['bright_value_v2','bright_value','brightness','bright'],temperature:['temp_set','temp_set_f','temperature'],color:['colour_data_v2','colour_data','color_data'],volume:['volume_set','volume'],mediaAction:['play_control','media_control'],locked:['switch_lock','lock_motor_state','unlock'],position:['percent_control','position'],cameraAction:['basic_private','privacy']};
  const candidates = aliases[property]||[];
  const code = candidates.find(candidate => codes.includes(candidate));
  if (!code) throw new Error(`O aparelho não oferece o controle “${property}” pela API Tuya.`);
  const definition = functions.find(item => item.code === code);
  let normalized = value;
  if (property === 'brightness') {
    try {
      const spec = typeof definition.values === 'string' ? JSON.parse(definition.values) : definition.values;
      const min = Number(spec?.min ?? 0); const max = Number(spec?.max ?? 100);
      normalized = Math.round(min + (Number(value) / 100) * (max - min));
    } catch { normalized = Number(value); }
  }
  if (property === 'temperature') {
    try {
      const spec = typeof definition.values === 'string' ? JSON.parse(definition.values) : definition.values;
      normalized = Math.round(Number(value) / Number(spec?.scale ? 10 ** -spec.scale : 1));
    } catch { normalized = Number(value); }
  }
  if(property==='color'){
    const [r,g,b]=String(value).slice(1).match(/../g).map(item=>parseInt(item,16)/255);const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=0;if(delta){if(max===r)h=60*(((g-b)/delta)%6);else if(max===g)h=60*((b-r)/delta+2);else h=60*((r-g)/delta+4);}if(h<0)h+=360;normalized=JSON.stringify({h:Math.round(h),s:Math.round(max?delta/max*1000:0),v:Math.round(max*1000)});
  }
  if(property==='cameraAction')normalized=value==='privacy_on';
  return { code, value: normalized };
}
