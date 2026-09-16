import { useEffect, useRef } from 'react';

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
      if (stopped || document.visibilityState === 'hidden') return;
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        await latest.current();
      } catch {
        /* Foreground load and actions show errors. */
      } finally {
        running = false;
        if (queued && !stopped) {
          queued = false;
          void run();
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void run();
    };
    const timer = setInterval(run, intervalMs);
    window.addEventListener('focus', run);
    window.addEventListener('online', run);
    window.addEventListener('service-data-changed', run);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('focus', run);
      window.removeEventListener('online', run);
      window.removeEventListener('service-data-changed', run);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs]);
}
