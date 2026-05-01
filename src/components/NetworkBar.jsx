import React from 'react';
import useNetworkHealth from "../hooks/useNetworkHealth";

export default function NetworkBar({ queuedCount }) {
  const { latency, status, mode } = useNetworkHealth();

  const getColor = () => {
    if (status === "strong") return "bg-green-500";
    if (status === "unstable") return "bg-yellow-500";
    if (status === "poor") return "bg-orange-500";
    if (status === "offline") return "bg-red-600 offline-pulse";
    return "bg-red-600";
  };

  return (
    <div className={`network-bar w-full p-2 text-white flex justify-between ${getColor()} transition-all duration-500`}>
      <div className="flex gap-4" style={{ alignItems: 'center' }}>
        <span className={`network-signal ${status}`} aria-hidden="true"></span>
        <span>Signal {status.toUpperCase()}</span>
        <span>Latency {latency !== null ? `${latency} ms` : "--"}</span>
        <span>{mode}</span>
      </div>

      <div style={{ alignItems: 'center', display: 'flex' }}>
        {status === "offline" && (
          <span>{queuedCount} queued</span>
        )}
      </div>
    </div>
  );
}
