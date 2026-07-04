import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function useNetworkHealth() {
  const [latency, setLatency] = useState(null);
  const [status, setStatus] = useState("offline");
  const [mode, setMode] = useState("Offline Mode");

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setStatus("offline");
        setMode("Offline Mode");
        return;
      }

      try {
        const start = performance.now();

        await fetch(`${BASE_URL}/api/ping`);

        const end = performance.now();
        const rtt = Math.round(end - start);

        setLatency(rtt);

        if (rtt < 100) setStatus("strong");
        else if (rtt < 300) setStatus("unstable");
        else setStatus("poor");

        setMode("Live Mode");
      } catch (_unusedVariable) {
        setStatus("offline");
        setMode("Offline Mode");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { latency, status, mode };
}
