import crypto from 'node:crypto';

export class EventBus {
  #listeners = new Set();

  publish(type, payload = {}) {
    const event = { id: crypto.randomUUID(), type, payload, occurredAt: new Date().toISOString() };
    for (const listener of this.#listeners) listener(event);
    return event;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  stream(req, res, filter = () => true) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    res.write(`event: ready\ndata: ${JSON.stringify({ connected: true })}\n\n`);
    const unsubscribe = this.subscribe(event => {if(filter(event))res.write(`id: ${event.id}\nevent: home-event\ndata: ${JSON.stringify(event)}\n\n`)});
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);
    req.on('close', () => { clearInterval(heartbeat); unsubscribe(); });
  }
}
