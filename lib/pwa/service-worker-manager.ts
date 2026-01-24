"use client";

import { Workbox } from "workbox-window";

let wb: Workbox | undefined;

export function registerServiceWorker() {
    if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        process.env.NODE_ENV === "production"
    ) {
        wb = new Workbox("/sw.js");

        wb.addEventListener("installed", (event) => {
            if (event.isUpdate) {
                console.log("[PWA] New version available");
                // Show update notification
                if (confirm("A new version of Famio is available. Reload to update?")) {
                    wb?.messageSkipWaiting();
                    window.location.reload();
                }
            }
        });

        wb.addEventListener("activated", () => {
            console.log("[PWA] Service worker activated");
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
