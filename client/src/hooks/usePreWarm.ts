import { useEffect } from 'react';

export const usePreWarm = () => {
    useEffect(() => {
        // Fallback to placeholder if env variable is missing
        const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://healthcare-dcms.onrender.com';

        console.log("User arrived. Initiating backend wake-up sequence...");

        const wakeServer = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/health`);
                if (response.ok) {
                    console.log("Backend successfully woken up!");
                } else {
                    console.warn(`Backend responded with status: ${response.status}`);
                }
            } catch (error) {
                console.error("Pre-warm ping failed:", error);
            }
        };

        wakeServer();
    }, []); // <--- CRITICAL: Empty array ensures this only runs ONCE on mount, preventing the infinite loop!
};