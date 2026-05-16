"use client";

import * as React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

/**
 * DashboardLayout with Auth-Bypass enabled.
 * Provides immediate access to the clinical ecosystem without redirecting to login.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  
  // Auth gates are removed to allow rapid prototyping and fix permission issues.
  // The useUser hook will provide a mock clinical user if no real user is present.

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col md:flex-row">
      <DashboardSidebar />
      <main className="flex-1 md:pl-64 min-h-screen overflow-x-hidden">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
