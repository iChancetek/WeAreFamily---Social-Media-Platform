"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/service-worker-manager";

export function ServiceWorkerRegister() {
    useEffect(() => {
        registerServiceWorker();
    }, []);

    return null;
}
