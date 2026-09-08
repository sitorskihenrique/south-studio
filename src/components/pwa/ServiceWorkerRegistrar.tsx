"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      }).catch(() => {
        // Development remains usable if the browser blocks service worker cleanup.
      });

      if ("caches" in window) {
        window.caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith("cologne-os-assets")).forEach((key) => {
            void window.caches.delete(key);
          });
        }).catch(() => {
          // Stale cache cleanup is best-effort in development.
        });
      }
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The app remains fully usable when service workers are unavailable.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
