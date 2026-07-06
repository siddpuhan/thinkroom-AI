"use client";
import React from 'react';
import useNetworkHealth from "../hooks/useNetworkHealth";

export default function NetworkStatus({ queuedCount }) {
  const { latency, status } = useNetworkHealth();

  return (
    <div 
      className={`network-status-pill ${status === 'offline' ? 'offline-pulse' : ''}`}
      title="Network Latency"
    >
      <span className={`status-dot ${status}`}></span>
      <span className="status-text">
        {status === 'offline' ? 'Offline' : `${latency !== null ? latency : '--'} ms`}
      </span>
      {status === 'offline' && queuedCount > 0 && (
        <span className="queued-count">({queuedCount} queued)</span>
      )}
    </div>
  );
}
