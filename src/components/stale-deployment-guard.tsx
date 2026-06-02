'use client';

import { useEffect } from 'react';

export function StaleDeploymentGuard() {
  useEffect(() => {
    function handleRejection(event: PromiseRejectionEvent) {
      const msg = event.reason?.message ?? String(event.reason ?? '');
      if (msg.includes('Failed to find Server Action')) {
        window.location.reload();
      }
    }
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return null;
}
