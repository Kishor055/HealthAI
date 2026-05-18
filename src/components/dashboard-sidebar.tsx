
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  HeartPulse,
  ClipboardType,
  LayoutDashboard,
  Map,
  MessageSquare,
  PanelLeft,
  Pill,
  Search,
  Settings,
  ShieldAlert,
  CalendarDays,
  Activity,
  Languages,
  Globe
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserNav } from '@/components/user-nav';
import { useLanguage } from '@/context/language-context';
import { Locale } from '@/lib/translations';

export const DashboardSidebar = React.memo(() => {
  const pathname = usePathname();
  const { t, locale, setLocale } = useLanguage();

  const NAV_ITEMS = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.dashboard },
    { href: '/dashboard/reminders-alerts', icon: Bell, label: t.reminders },
    { href: '/dashboard/medications', icon: Pill, label: t.medications },
    { href: '/dashboard/prescriptions', icon: ClipboardType, label: t.prescriptions },
    { href: '/dashboard/appointments', icon: CalendarDays, label: t.appointments },
    { href: '/dashboard/health-records', icon: Activity, label: t.healthRecords },
    { href: '/dashboard/chat', icon: MessageSquare, label: t.aiAssistant },
    { href: '/dashboard/discover', icon: Map, label: t.discover },
  ];

  const navLinks = React.useMemo(() => (
    <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4 mt-4">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group',
            pathname === item.href 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
              : 'text-muted-foreground hover:bg-muted hover:text-primary'
          )}
        >
          <item.icon className={cn('h-5 w-5 transition-transform group-hover:scale-110', { 'text-primary-foreground': pathname === item.href })} />
          <span className="font-semibold tracking-tight">{item.label}</span>
        </Link>
      ))}
    </nav>
  ), [pathname, t]);

  const LanguageSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted">
          <Languages className="h-5 w-5" />
          <span className="font-semibold">{t.language} ({locale.toUpperCase()})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl">
        <DropdownMenuLabel>{t.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocale('en')} className={cn(locale === 'en' && "bg-primary/10 text-primary")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('hi')} className={cn(locale === 'hi' && "bg-primary/10 text-primary")}>हिन्दी (Hindi)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale('mr')} className={cn(locale === 'mr' && "bg-primary/10 text-primary")}>मराठी (Marathi)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="hidden border-r bg-card md:block md:fixed md:inset-y-0 md:left-0 md:z-10 md:w-64 shadow-xl">
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-20 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-3 font-black text-xl tracking-tighter">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                <HeartPulse className="h-6 w-6" />
              </div>
              <span className="font-headline text-primary">HealthAI</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {navLinks}
            <div className="px-2 lg:px-4 mt-2">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="mt-auto p-4 border-t bg-muted/30">
            <UserNav />
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      <header className="flex h-16 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 md:hidden sticky top-0 z-50">
         <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
                <PanelLeft className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72 border-r">
                <div className="flex h-20 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-3 font-black text-xl tracking-tighter">
                       <div className="w-10 h-10 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center">
                            <HeartPulse className="h-6 w-6" />
                        </div>
                        <span className="font-headline">HealthAI</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                    {navLinks}
                    <div className="px-4 mt-2">
                      <LanguageSwitcher />
                    </div>
                </div>
                <div className="mt-auto p-4 border-t">
                    <UserNav />
                </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex items-center justify-between">
             <h1 className="font-black tracking-tighter text-lg uppercase text-primary">Portal</h1>
             <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="h-5 w-5" />
             </Button>
          </div>
      </header>
    </>
  );
});
DashboardSidebar.displayName = "DashboardSidebar";
