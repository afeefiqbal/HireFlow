'use client';

import React, { useEffect, useState } from 'react';

interface ClientDateProps {
  date: string | number | Date | null | undefined;
  type?: 'date' | 'datetime' | 'time';
  className?: string;
  fallback?: string;
}

export function ClientDate({
  date,
  type = 'date',
  className = '',
  fallback = '—',
}: ClientDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) return <span className={className}>{fallback}</span>;

  const d = new Date(date);
  if (isNaN(d.getTime())) return <span className={className}>{fallback}</span>;

  // Initial SSR rendering uses fixed ISO string to avoid locale mismatch
  if (!mounted) {
    return (
      <span className={className} suppressHydrationWarning>
        {d.toISOString().split('T')[0]}
      </span>
    );
  }

  // Once mounted in browser, format using user locale
  let formatted = '';
  if (type === 'datetime') {
    formatted = d.toLocaleString();
  } else if (type === 'time') {
    formatted = d.toLocaleTimeString();
  } else {
    formatted = d.toLocaleDateString();
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
