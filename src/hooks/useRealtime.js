import { useEffect, useState } from 'react';

export function useRealtime(onEvent, url = '/api/events') {
  const [state, setState] = useState('connecting');
  useEffect(() => {
    const source = new EventSource(url);
    source.addEventListener('ready', () => setState('live'));
    source.addEventListener('home-event', message => {
      setState('live');
      try { onEvent(JSON.parse(message.data)); } catch { /* evento inválido é ignorado */ }
    });
    source.onerror = () => setState('reconnecting');
    return () => source.close();
  }, [onEvent,url]);
  return state;
}
