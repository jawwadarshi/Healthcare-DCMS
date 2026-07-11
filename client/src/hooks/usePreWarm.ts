import { useEffect, useState } from 'react';

export function usePreWarm() {
    const [isServerAwake, setIsServerAwake] = useState(false);

    useEffect(() => {
        // Dynamically uses your Vercel env variable, fallback to absolute string if needed
        const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://your-dental-backend.onrender.com';

        console.log("User arrived. Initiating backend wake-up sequence...");

        // Send a lightweight ping immediately when page mounts
        fetch(`${BACKEND_URL}/api/health`)
            .then((res) => {
                if (res.ok) {
                    setIsServerAwake(true);
                    console.log("Backend server is fully awake.");
                }
            })
            .catch((err) => console.error("Pre-warm ping failed:", err));
    }, []);

    return isServerAwake;
}