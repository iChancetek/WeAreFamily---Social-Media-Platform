"use client";

import { Workbox } from "workbox-window";

let wb: Workbox | undefined;
let updateApplied = false;

export function registerServiceWorker() {
    if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        process.env.NODE_ENV === "production"
    ) {
        wb = new Workbox("/sw.js");

        wb.addEventListener("installed", (event) => {
            if (event.isUpdate && !updateApplied) {
                updateApplied = true;
                console.log("[PWA] New version available — will apply silently on next page load.");

                // Do NOT prompt the user. Instead, silently activate the new
                // service worker immediately in the background. The next time
                // they navigate or refresh naturally, they will get the new version.
                wb?.messageSkipWaiting();
            }
        });

        wb.addEventListener("controlling", () => {
            console.log("[PWA] New service worker is now controlling the page.");
            if (updateApplied) {
                console.log("[PWA] Reloading to apply update immediately...");
                window.location.reload();
            }
        });

        wb.addEventListener("activated", () => {
            console.log("[PWA] Service worker activated.");
        });

        wb.register().catch((err) => {
            console.error("[PWA] Service worker registration failed:", err);
        });
    }
}

export function unregisterServiceWorker() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
                registrations.forEach((registration) => {
                    registration.unregister();
                });
            });
    }
}
