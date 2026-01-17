"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Bot,
  ClipboardType,
  LayoutDashboard,
  Map,
  MessageSquare,
  PanelLeft,
  Pill,
  Search,
  Settings,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserNav } from '@/components/user-nav';
import { Input } from './ui/input';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/prescriptions', icon: ClipboardType, label: 'Prescriptions' },
  { href: '/dashboard/medications', icon: Pill, label: 'Medications' },
  { href: '/dashboard/chat', icon: MessageSquare, label: 'Chat Assistant' },
  { href: '/dashboard/discover', icon: Map, label: 'Discover' },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const navLinks = (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            { 'bg-muted text-primary': pathname === item.href }
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <div className="hidden border-r bg-muted/40 md:block md:fixed md:inset-y-0 md:left-0 md:z-10 md:w-64">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <span className="font-headline">HealthAI</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            {navLinks}
          </div>
          <div className="mt-auto p-4">
            <UserNav />
          </div>
        </div>
      </div>
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
         <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                       <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                            <Bot className="h-5 w-5" />
                        </div>
                        <span className="font-headline">HealthAI</span>
                    </Link>
                </div>
                <div className="flex-1 py-2">
                    {navLinks}
                </div>
                <div className="mt-auto p-4 border-t">
                    <UserNav />
                </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full appearance-none bg-background pl-8 shadow-none"
                />
              </div>
            </form>
          </div>
      </header>
    </>
  );
}
