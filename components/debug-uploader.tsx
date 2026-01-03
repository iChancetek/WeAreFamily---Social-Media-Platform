"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export function DebugUploader() {
    const [logs, setLogs] = useState<string[]>([]);
    const [isBusy, setIsBusy] = useState(false);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, pathType: 'profile' | 'post') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsBusy(true);
        setLogs([]); // clear logs
        addLog(`STARTING ${pathType.toUpperCase()} UPLOAD TEST: ${file.name}`);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                addLog("ERROR: auth.currentUser is null!");
                return;
            }
            addLog(`AUTH OK: User ID = ${user.uid}`);

            // Path selection
            // Profile path (Known working?): users/{uid}/profile/debug-{timestamp}
            // Post path (Failing?): users/{uid}/posts/debug-{timestamp}
            const path = `users/${user.uid}/${pathType}/debug-${Date.now()}-${file.name}`;
            addLog(`TARGET PATH: ${path}`);

            const storageRef = ref(storage, path);

            addLog("Starting uploadBytes with metadata...");
            const metadata = { contentType: file.type };
            const snapshot = await uploadBytes(storageRef, file, metadata);
            addLog(`UPLOAD SUCCESS! bytes: ${snapshot.metadata.size}`);

            const url = await getDownloadURL(snapshot.ref);
            addLog(`URL: ${url}`);
            alert(`SUCCESS (${pathType})!\nURL: ${url}`);

        } catch (err: any) {
            addLog(`ERROR: ${err.message}`);
            if (err.serverId) addLog(`Server ID: ${err.serverId}`);
            if (err.serverResponse) addLog(`Server Response: ${err.serverResponse}`);
            console.error(err);
            alert(`FAILED (${pathType}): ${err.message}`);
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="p-4 m-4 border-4 border-red-500 bg-black text-green-400 font-mono text-xs rounded-lg shadow-2xl z-50 relative">
            <h3 className="text-xl font-bold text-red-500 mb-2">DIAGNOSTIC TOOL v2</h3>

            <div className="flex flex-col gap-4 mb-4">
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded cursor-pointer font-bold text-center">
                    1. TEST PROFILE PATH (Should Work)
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleUpload(e, 'profile')}
                        disabled={isBusy}
                    />
                </label>

                <label className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded cursor-pointer font-bold text-center">
                    2. TEST POST PATH (Failing?)
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleUpload(e, 'post')}
                        disabled={isBusy}
                    />
                </label>
            </div>

            <div className="bg-zinc-900 p-2 rounded h-64 overflow-y-auto border border-zinc-700 whitespace-pre-wrap">
                {logs.length === 0 ? <span className="text-gray-500">Select a file to begin...</span> : logs.map((log, i) => (
                    <div key={i} className="mb-1 border-b border-zinc-800 pb-1">{log}</div>
                ))}
            </div>
        </div>
    );
}
