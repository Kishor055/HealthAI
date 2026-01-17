"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuth, setIsAuth] = React.useState(false);
  
  React.useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.replace('/');
    } else {
      setIsAuth(true);
    }
  }, [router]);

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* You can add a loader here */}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <DashboardSidebar />
      <main className="md:pl-64">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
