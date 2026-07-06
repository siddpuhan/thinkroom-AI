"use client";

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
      <p className="text-slate-400">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
