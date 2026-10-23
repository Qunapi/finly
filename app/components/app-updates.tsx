"use client";
import { useEffect } from "react";
import { flushUrlUpdates } from "../lib/url-updates";

export default function AppUpdates({ base }: { base: string }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let disposed = false;
    let checking = false;
    const reload = () => {
      flushUrlUpdates();
      window.location.reload();
    };
    const retirePwa = async () => {
      if (!("serviceWorker" in navigator)) return false;
      const scope = `${window.location.origin}${base}/`;
      const registrations = (await navigator.serviceWorker.getRegistrations()).filter((reg) => reg.scope === scope);
      const controlled = navigator.serviceWorker.controller?.scriptURL === `${scope}sw.js`;
      await Promise.all(registrations.map((reg) => reg.unregister()));
      if ("caches" in window) {
        const prefix = `finly-${base}/-`;
        for (const key of await caches.keys()) if (key.startsWith(prefix)) await caches.delete(key);
      }
      if (registrations.length && controlled && !disposed) {
        reload();
        return true;
      }
      return false;
    };
    const check = async () => {
      if (disposed || checking || document.visibilityState !== "visible") return;
      checking = true;
      const abort = new AbortController();
      const timer = window.setTimeout(() => abort.abort(), 10000);
      try {
        const response = await fetch(`${base}/version.json?t=${Date.now()}`, {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (
          !data ||
          typeof data !== "object" ||
          !("version" in data) ||
          typeof data.version !== "string" ||
          !/^[a-f0-9]{16}$/.test(data.version)
        )
          return;
        if (disposed || data.version === process.env.NEXT_PUBLIC_APP_VERSION) return;
        // Avoid refresh loops while different CDN edges finish a deployment.
        try {
          let previous: { version?: string; at?: number } | null = null;
          try {
            previous = JSON.parse(sessionStorage.getItem("finly-auto-reloaded") ?? "null");
          } catch {}
          if (previous?.version === data.version && typeof previous.at === "number" && Date.now() - previous.at < 60000)
            return;
          sessionStorage.setItem("finly-auto-reloaded", JSON.stringify({ version: data.version, at: Date.now() }));
        } catch {
          return;
        }
        reload();
      } catch {
        // Offline or an incomplete deployment: keep the current calculator usable.
      } finally {
        window.clearTimeout(timer);
        checking = false;
      }
    };
    void retirePwa()
      .catch(() => false)
      .then((reloaded) => {
        if (!reloaded && !disposed) void check();
      });
    const visible = () => {
      void check();
    };
    document.addEventListener("visibilitychange", visible);
    const interval = window.setInterval(visible, 60000);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(interval);
    };
  }, [base]);
  return null;
}
