import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useLiveRefresh(refresh, enabled = true, intervalMs = 30000) {
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (!enabled) return undefined;
    let running = false;
    let stopped = false;
    let queued = false;
    const run = async () => {
      if (stopped || AppState.currentState !== 'active') return;
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try { await latest.current(); } catch { /* Retry on the next foreground refresh. */ }
      finally {
        running = false;
        if (queued && !stopped) {
          queued = false;
          void run();
        }
      }
    };
    const timer = setInterval(run, intervalMs);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') run(); });
    return () => { stopped = true; clearInterval(timer); sub.remove(); };
  }, [enabled, intervalMs]);
}
