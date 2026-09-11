import { useEffect, useRef } from 'react';

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
      if (stopped || running || document.visibilityState === 'hidden') return;
      running = true;
      try { await latest.current(); } catch { /* Foreground load and actions show errors. */ }
      finally { running = false; }
    };
    const timer = setInterval(run, 5000);
    window.addEventListener('focus', run);
    window.addEventListener('online', run);
    window.addEventListener('service-data-changed', run);
    return () => { stopped = true; clearInterval(timer); window.removeEventListener('focus', run); window.removeEventListener('online', run); window.removeEventListener('service-data-changed', run); };
  }, [enabled]);
}
