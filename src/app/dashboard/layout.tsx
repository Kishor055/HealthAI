
"use client";

import * as React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

/**
 * DashboardLayout - AUTH GATING REMOVED for active prototyping.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading } = useUser();

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
