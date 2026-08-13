"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Admin layout — wraps ALL /admin/* routes.
// Provides shared auth guard and prevents the full-page reload effect
// when navigating between admin pages using router.push().
// This layout persists across admin route transitions.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === '/admin/login') {
      setChecked(true);
      return;
    }

    // Check for admin token in localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      setChecked(true);
    }
  }, [pathname, router]);

  // Show minimal spinner while checking auth (avoids flash)
  if (!checked && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0F3D30] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
