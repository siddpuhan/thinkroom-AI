// @ts-nocheck
import { useState, useEffect } from 'react';
import { saveResource, getAllResources } from '../db';

export function useResources() {
  const [resources, setResources] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);

  async function loadResources() {
    const allResources = await getAllResources();
    setResources(allResources);
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, []);

  async function addResource({ type, category, description }) {
    const newResource = {
      type,
      category,
      description,
      timestamp: Date.now(),
      status: 'active',
    };
    await saveResource(newResource);
    await loadResources();
  }

  return { resources, loading, addResource };
}
