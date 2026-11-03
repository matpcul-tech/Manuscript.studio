'use client';
import { useEffect, useState } from 'react';

// True once the server reports yearly Stripe prices are configured.
export function useYearlyAvailable(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    fetch('/api/billing/config')
      .then(r => r.json())
      .then(j => setOk(!!j.yearly))
      .catch(() => setOk(false));
  }, []);
  return ok;
}
