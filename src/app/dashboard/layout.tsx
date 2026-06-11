
"use client";

import * as React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DashboardLayout - Stable clinical interface container.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading, user } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="text-center space-y-4">
           <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Clinical Node...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col md:flex-row font-body">
      <DashboardSidebar />
      <main className="flex-1 md:pl-64 min-h-screen overflow-x-hidden bg-slate-50/30">
        <AnimatePresence mode="wait">
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.3 }}
           >
             {children}
           </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
    </div>
  );
}
