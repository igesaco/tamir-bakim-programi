import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useLiveRefresh(refresh, enabled = true) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (!enabled) return undefined;
    let running = false;
    let stopped = false;
    const run = async () => {
      if (stopped || running || AppState.currentState !== 'active') return;
      running = true;
      try { await latest.current(); } catch { /* Retry on the next foreground refresh. */ }
      finally { running = false; }
    };
    const timer = setInterval(run, 5000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') run(); });
    return () => { stopped = true; clearInterval(timer); sub.remove(); };
  }, [enabled]);
}
