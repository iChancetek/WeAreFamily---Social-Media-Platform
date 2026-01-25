export const generateVideoThumbnail = (file: File): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 1; // Capture at 1s

        video.onloadeddata = () => {
            // 
        };

        video.onseeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            } catch (e) {
                console.error("Canvas draw failed", e);
                resolve(null);
            }
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve(null);
        };
    });
}
