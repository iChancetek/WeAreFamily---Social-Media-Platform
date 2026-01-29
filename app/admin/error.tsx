'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin Route Error:', error);
    }, [error]);

    return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg m-4 border border-red-200">
            <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
            <p className="mb-4 text-gray-700">The admin dashboard encountered a critical error.</p>
            <p className="text-xs font-mono bg-white p-2 rounded mb-4 inline-block">{error.message}</p>
            <div>
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
