// @ts-nocheck
import { useEffect, useState } from "react";
import { API_BASE_URL } from '../apiConfig';
const BASE_URL = API_BASE_URL;

export default function useNetworkHealth() {
  const [latency, setLatency] = useState<any>(null);
  const [status, setStatus] = useState<any>("offline");
  const [mode, setMode] = useState<any>("Offline Mode");

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
