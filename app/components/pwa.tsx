"use client";
import { useEffect, useRef, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function Pwa({ base }: { base: string }) {
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const installed = () =>
      setStandalone(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    installed();
    display.addEventListener("change", installed);
    const offerInstall = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const didInstall = () => {
      setInstall(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", offerInstall);
    window.addEventListener("appinstalled", didInstall);
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator))
      return () => {
        display.removeEventListener("change", installed);
        window.removeEventListener("beforeinstallprompt", offerInstall);
        window.removeEventListener("appinstalled", didInstall);
      };
    let disposed = false;
    const controlled = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    const controllerChanged = () => {
      if (controlled && !reloading) {
        reloading = true;
        window.location.reload();
      }
    };
    const check = () => {
      if (document.visibilityState === "visible") registration.current?.update().catch(() => {});
    };
    navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
    document.addEventListener("visibilitychange", check);
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/`, updateViaCache: "none" })
      .then((reg) => {
        if (disposed) return;
        registration.current = reg;
        if (reg.waiting) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (!disposed && worker.state === "installed" && navigator.serviceWorker.controller)
              setWaiting(reg.waiting);
          });
        });
        reg.update().catch(() => {});
      })
      .catch(() => setMessage("Tryb offline niedostępny. Spróbuj ponownie po połączeniu z internetem."));
    return () => {
      disposed = true;
      display.removeEventListener("change", installed);
      window.removeEventListener("beforeinstallprompt", offerInstall);
      window.removeEventListener("appinstalled", didInstall);
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChanged);
      document.removeEventListener("visibilitychange", check);
    };
  }, [base]);

  return (
    <aside className="pwa-controls" aria-label="Aplikacja Finly">
      {!standalone && (
        <button
          type="button"
          onClick={async () => {
            if (install) {
              await install.prompt();
              await install.userChoice;
              setInstall(null);
            } else
              setMessage(
                "iPhone/iPad: w Safari wybierz Udostępnij → Do ekranu początkowego. Android/komputer: w menu przeglądarki wybierz Zainstaluj aplikację.",
              );
          }}
        >
          Zainstaluj aplikację
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          if (!registration.current) {
            setMessage("Tryb offline jest jeszcze przygotowywany. Spróbuj za chwilę.");
            return;
          }
          try {
            await registration.current.update();
            if (registration.current.waiting) setWaiting(registration.current.waiting);
            setMessage("Sprawdzono aktualizacje. Nowa wersja pojawi się tutaj, gdy będzie gotowa.");
          } catch {
            setMessage("Nie można sprawdzić aktualizacji. Sprawdź połączenie z internetem.");
          }
        }}
      >
        Sprawdź aktualizacje
      </button>
      {message && <p role="status">{message}</p>}
      {waiting && (
        <div className="pwa-update" role="status">
          <span>Nowa wersja Finly jest gotowa.</span>
          <button type="button" onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}>
            Aktualizuj teraz
          </button>
        </div>
      )}
    </aside>
  );
}
