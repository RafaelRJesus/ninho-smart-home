function normalize(value = '') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function parseLocally(text, devices) {
  const input = normalize(text);
  const all = /\b(tudo|todos|todas|casa inteira)\b/.test(input);
  const room = [...new Set(devices.map(d => d.room))].find(name => input.includes(normalize(name)));
  const type = /\b(luz|luzes|lampada|lampadas)\b/.test(input) ? 'light' : /\b(ar|climatizador)\b/.test(input) ? 'ac' : /\b(tv|televisao)\b/.test(input) ? 'tv' : /\b(tomada|tomadas)\b/.test(input) ? 'plug' : null;
  const named = devices.find(device => input.includes(normalize(device.name)));
  const targets = named ? [named] : devices.filter(device => (all || room || type) && (!room || device.room === room) && (!type || device.type === type));
  const off = /\b(deslig|apague|apagar)\w*/.test(input);
  const on = /\b(lig|acend)\w*/.test(input) && !off;
  const temperature = input.match(/(?:para|em)\s*(1[6-9]|2\d|30)\s*(?:graus)?/)?.[1];
  const brightness = input.match(/(?:brilho|luminosidade)(?:\s+(?:para|em|de))?\s*(\d{1,3})/)?.[1];
  const controls = {};
  if (on || off) controls.power = on;
  if (temperature) controls.temperature = Number(temperature);
  if (brightness) controls.brightness = Math.min(100, Number(brightness));
  return { targetIds: targets.map(d => d.id), controls, understood: targets.length > 0 && Object.keys(controls).length > 0 };
}

export async function parseWithAI(text, devices) {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
      instructions: 'Interprete comandos de automação residencial em português. Se o pedido não for um comando de dispositivo, não invente ações.',
      input: JSON.stringify({ command: text, devices: devices.map(({ id, name, room, type }) => ({ id, name, room, type })) }),
      text: { format: { type: 'json_schema', name: 'home_command', strict: true, schema: {
        type: 'object', additionalProperties: false, required: ['targetIds', 'controls', 'reply'], properties: {
          targetIds: { type: 'array', items: { type: 'string' } },
          controls: { type: 'object', additionalProperties: false, required: ['power', 'brightness', 'temperature'], properties: {
            power: { type: ['boolean', 'null'] }, brightness: { type: ['number', 'null'], minimum: 0, maximum: 100 }, temperature: { type: ['number', 'null'], minimum: 16, maximum: 30 }
          } }, reply: { type: 'string' }
        }
      } } }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'A IA não respondeu.');
  const output = data.output_text || data.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  const parsed = JSON.parse(output);
  parsed.controls = Object.fromEntries(Object.entries(parsed.controls).filter(([, value]) => value !== null));
  return parsed;
}

export async function understand(text, devices) {
  const local = parseLocally(text, devices);
  if (local.understood) return local;
  return await parseWithAI(text, devices) || local;
}
