"use client";

import { useRouter } from 'next/navigation';
import ResourceBoard from '../../ResourceBoard';

// Route protection is handled exclusively by the middleware (the single guard).
// Navigation back to the landing page is a normal client transition to an
// unprotected route, so router.push is safe here.
export default function Resources() {
  const router = useRouter();

  return <ResourceBoard onBack={() => router.push('/')} />;
}
