import { useEffect, useState } from 'react';

export function useRealtime(onEvent) {
  const [state, setState] = useState('connecting');
  useEffect(() => {
    const source = new EventSource('/api/events');
    source.addEventListener('ready', () => setState('live'));
    source.addEventListener('home-event', message => {
      setState('live');
      try { onEvent(JSON.parse(message.data)); } catch { /* evento inválido é ignorado */ }
    });
    source.onerror = () => setState('reconnecting');
    return () => source.close();
  }, [onEvent]);
  return state;
}
