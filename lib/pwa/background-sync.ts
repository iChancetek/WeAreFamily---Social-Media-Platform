"use client";

// Background Sync API wrapper for queuing actions when offline

export interface SyncQueueItem {
    id: string;
    type: 'message' | 'post' | 'reaction' | 'comment';
    data: any;
    timestamp: number;
    retryCount: number;
}

class BackgroundSyncManager {
    private dbName = 'famio-sync-queue';
    private storeName = 'pending-syncs';
    private db: IDBDatabase | null = null;

    async init() {
        if (typeof window === 'undefined' || this.db) return;

        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
        });
    }

    async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        const queueItem: SyncQueueItem = {
            ...item,
            id: `${item.type}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            retryCount: 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(queueItem);

            request.onsuccess = () => resolve(queueItem.id);
            request.onerror = () => reject(request.error);
        });
    }

    async getQueue(): Promise<SyncQueueItem[]> {
        await this.init();
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeFromQueue(id: string): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearQueue(): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async registerSync(tag: string): Promise<void> {
        if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
            console.log('Background Sync not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register(tag);
            console.log('Background sync registered:', tag);
        } catch (error) {
            console.error('Error registering background sync:', error);
        }
    }
}

export const syncManager = new BackgroundSyncManager();

// Helper functions for common sync operations
export async function queueMessage(messageData: any) {
    const id = await syncManager.addToQueue({
        type: 'message',
        data: messageData
    });
    await syncManager.registerSync('sync-messages');
    return id;
}

export async function queuePost(postData: any) {
    const id = await syncManager.addToQueue({
        type: 'post',
        data: postData
    });
    await syncManager.registerSync('sync-posts');
    return id;
}

export async function queueReaction(reactionData: any) {
    const id = await syncManager.addToQueue({
        type: 'reaction',
        data: reactionData
    });
    await syncManager.registerSync('sync-reactions');
    return id;
}
