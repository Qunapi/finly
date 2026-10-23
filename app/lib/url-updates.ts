type UrlPatch = (url: URL) => void;
type UpdateEnvironment = {
  read: () => URL;
  replace: (url: string) => void;
  schedule: (callback: () => void, delay: number) => () => void;
};

// Safari allows only 100 history updates in 30 seconds. Coalesce all controls
// into one write per 500 ms, while calculations continue to update immediately.
export function createUrlUpdater(environment: UpdateEnvironment) {
  const pending = new Map<string, UrlPatch>();
  let cancel: (() => void) | null = null;
  let retryDelay = 1000;
  function flush() {
    cancel?.();
    cancel = null;
    if (!pending.size) return;
    const url = environment.read();
    const current = `${url.pathname}${url.search}${url.hash}`;
    for (const patch of pending.values()) patch(url);
    const next = `${url.pathname}${url.search}${url.hash}`;
    try {
      if (next !== current) environment.replace(next);
      pending.clear();
      retryDelay = 1000;
    } catch (error) {
      if (!(error && typeof error === "object" && "name" in error && error.name === "SecurityError")) throw error;
      // A tab may already be close to Safari's quota. Keep the newest values
      // and retry with backoff instead of letting a DOMException crash React.
      cancel = environment.schedule(flush, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  }
  return {
    queue(key: string, patch: UrlPatch) {
      pending.set(key, patch);
      if (!cancel) cancel = environment.schedule(flush, 500);
    },
    flush,
  };
}

let updater: ReturnType<typeof createUrlUpdater> | null = null;
export function queueUrlUpdate(key: string, patch: UrlPatch) {
  if (typeof window === "undefined") return;
  if (!updater) {
    updater = createUrlUpdater({
      read: () => new URL(window.location.href),
      replace: (url) => window.history.replaceState(window.history.state, "", url),
      schedule: (callback, delay) => {
        const timer = window.setTimeout(callback, delay);
        return () => window.clearTimeout(timer);
      },
    });
    const flush = () => updater?.flush();
    // Persist the final slider value before refresh, navigation, or suspension.
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }
  updater.queue(key, patch);
}

export function flushUrlUpdates() {
  updater?.flush();
}
