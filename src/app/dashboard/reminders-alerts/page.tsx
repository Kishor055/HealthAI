"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Pill, 
  ShieldAlert, 
  Timer, 
  MoreVertical, 
  ChevronRight,
  TrendingUp,
  History,
  Info,
  Activity,
  Check,
  X,
  Volume2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy } from 'firebase/firestore';

export default function RemindersAlertsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Stats Logic
  const stats = [
    { label: "Today's Medicines", value: "8", color: "text-blue-500", bg: "bg-blue-500/10", icon: Pill },
    { label: "Upcoming", value: "3", color: "text-primary", bg: "bg-primary/10", icon: Timer },
    { label: "Completed", value: "4", color: "text-accent", bg: "bg-accent/10", icon: CheckCircle2 },
    { label: "Missed", value: "1", color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-muted/20 p-4 sm:p-8 space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black font-headline tracking-tighter text-foreground"
          >
            Reminders & Alerts
          </motion.h1>
          <p className="text-muted-foreground font-medium">Enterprise medical schedule management system.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl font-bold gap-2">
            <History className="size-4" /> History
          </Button>
          <Button className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
            <Activity className="size-4" /> Schedule View
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <CardContent className="p-6 relative">
                <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="size-6" />
                </div>
                <div className="text-3xl font-black tracking-tighter mb-1">{stat.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <stat.icon className="size-24 -rotate-12" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Timeline Column */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="border-b bg-card/50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">Daily Intake Timeline</CardTitle>
                  <CardDescription className="font-medium">Sequence of scheduled medications for today.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">
                  Live Sync Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative p-8 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-[39px] top-8 bottom-8 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full" />
                
                {[
                  { name: "Lisinopril", dose: "10mg", time: "08:00 AM", status: "Completed", color: "text-accent", icon: CheckCircle2 },
                  { name: "Metformin", dose: "500mg", time: "12:30 PM", status: "Active Now", color: "text-primary", icon: Timer, current: true },
                  { name: "Sertraline", dose: "50mg", time: "06:00 PM", status: "Upcoming", color: "text-muted-foreground", icon: Clock },
                  { name: "Atorvastatin", dose: "20mg", time: "09:00 PM", status: "Upcoming", color: "text-muted-foreground", icon: Clock },
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="relative pl-14 group"
                  >
                    <div className={cn(
                      "absolute left-0 size-6 rounded-full border-4 border-background flex items-center justify-center z-10 transition-transform group-hover:scale-125 shadow-sm",
                      item.current ? "bg-primary pulse-red" : idx === 0 ? "bg-accent" : "bg-muted"
                    )} />
                    
                    <div className={cn(
                      "p-6 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6",
                      item.current ? "bg-primary/5 border-primary shadow-lg" : "bg-card border-border hover:border-primary/30"
                    )}>
                      <div className="flex items-center gap-5">
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-lg", item.current ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                          <Pill className="size-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{item.name}</h4>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px] font-bold py-0">{item.dose}</Badge>
                             <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{item.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {item.current ? (
                          <>
                            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-black px-6 rounded-xl h-12 shadow-lg shadow-accent/20">
                              <Check className="size-4 mr-2" /> Mark Taken
                            </Button>
                            <Button size="sm" variant="outline" className="font-black px-6 rounded-xl h-12 border-2">
                              Snooze
                            </Button>
                          </>
                        ) : idx === 0 ? (
                          <div className="flex items-center gap-2 text-accent font-black text-sm uppercase tracking-widest">
                            <CheckCircle2 className="size-5" /> Verified 08:05
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="font-black text-muted-foreground hover:text-primary rounded-xl h-12">
                            Remind Me
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 text-muted-foreground">
                          <MoreVertical className="size-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Column */}
        <div className="space-y-8">
          {/* Active Monitoring Alert */}
          <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert className="size-32 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tighter uppercase">
                <ShieldAlert className="size-6 animate-bounce" /> Clinical Shield
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 font-medium">AI continuous monitoring active.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-3">
                  <span>Adherence Score</span>
                  <span>94%</span>
                </div>
                <Progress value={94} className="h-3 bg-white/10" indicatorClassName="bg-white" />
              </div>
              <p className="text-xs font-medium leading-relaxed italic opacity-90">
                "Our AI system has detected consistent morning dose patterns. You're in the top 5% of healthy adherence."
              </p>
            </CardContent>
          </Card>

          {/* Categorized Alerts List */}
          <div className="space-y-4">
            <h3 className="text-lg font-black font-headline tracking-tight flex items-center gap-2 px-2">
              <Bell className="size-5 text-destructive" /> Active Alerts (3)
            </h3>
            
            <AnimatePresence>
              {[
                { title: "Drug Interaction", desc: "Combining Sertraline with your new supplement carries a moderate risk.", severity: "high", color: "bg-destructive/10 border-destructive text-destructive" },
                { title: "Missed Vitamin D", desc: "Scheduled for 9:00 AM. Taking it late may affect absorption.", severity: "medium", color: "bg-orange-500/10 border-orange-500 text-orange-600" },
                { title: "Refill Required", desc: "Lisinopril will run out in 3 days. We've notified your pharmacy.", severity: "low", color: "bg-blue-500/10 border-blue-500 text-blue-600" },
              ].map((alert, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ x: 5 }}
                  className={cn("p-5 rounded-[2rem] border-2 shadow-sm flex gap-4 transition-all group", alert.color)}
                >
                  <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform shadow-md", alert.color)}>
                    <AlertTriangle className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-sm uppercase tracking-tighter">{alert.title}</h5>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80">{alert.desc}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest px-4 hover:bg-black/5">Dismiss</Button>
                      <Button size="sm" className={cn("h-8 text-[10px] font-black uppercase tracking-widest px-4 shadow-lg", alert.severity === 'high' ? 'bg-destructive' : 'bg-primary')}>Resolve</Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Sound Alarm Card */}
          <Card className="border-none shadow-xl bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Volume2 className="size-4" /> Alarm System
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase">Critical Audio Chime</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Triggers on high priority</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold h-8 border-2">Test Tone</Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Persistent SOS Floating Button handled by SosButton component */}
    </div>
  );
}