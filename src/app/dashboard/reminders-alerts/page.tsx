
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
  History,
  Activity,
  Check,
  Plus,
  Loader2,
  BellOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { query, collection, orderBy, doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RemindersAlertsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newReminder, setNewReminder] = React.useState({ title: "", time: "09:00", description: "" });

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "reminders"), orderBy("time", "asc"));
  }, [firestore, user?.uid]);

  const { data: reminders, isLoading } = useCollection(remindersQuery);

  const handleCreateReminder = () => {
    if (!user || !firestore || !newReminder.title) return;
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "reminders"), {
      ...newReminder,
      isEnabled: true,
      createdAt: new Date().toISOString(),
    });
    setNewReminder({ title: "", time: "09:00", description: "" });
    setIsAddOpen(false);
  };

  const toggleReminder = (id: string, currentStatus: boolean) => {
    if (!user || !firestore) return;
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "reminders", id), { isEnabled: !currentStatus });
  };

  const deleteReminder = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "reminders", id));
  };

  const stats = [
    { label: "Active Reminders", value: reminders?.filter(r => r.isEnabled).length || 0, color: "text-blue-500", bg: "bg-blue-500/10", icon: Bell },
    { label: "Medication Checks", value: "8", color: "text-primary", bg: "bg-primary/10", icon: Pill },
    { label: "Stability Score", value: "94%", color: "text-accent", bg: "bg-accent/10", icon: CheckCircle2 },
    { label: "Alerts Cleared", value: "12", color: "text-destructive", bg: "bg-destructive/10", icon: ShieldAlert },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-muted/20 p-4 sm:p-8 space-y-8 pb-24"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-foreground">Reminders & Alerts</h1>
          <p className="text-muted-foreground font-medium">Enterprise medical schedule management system.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20 h-12 px-6">
                <Plus className="size-5" /> New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Create Schedule</DialogTitle>
                <DialogDescription>Add a specific reminder for medication or clinical tasks.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Task / Medicine Title</label>
                  <Input placeholder="e.g. Morning Multivitamin" value={newReminder.title} onChange={(e) => setNewReminder({...newReminder, title: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Reminder Time</label>
                  <Input type="time" value={newReminder.time} onChange={(e) => setNewReminder({...newReminder, time: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Optional Notes</label>
                  <Input placeholder="Take with food" value={newReminder.description} onChange={(e) => setNewReminder({...newReminder, description: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <Button className="w-full h-14 rounded-2xl font-black text-lg mt-4 shadow-xl shadow-primary/20" onClick={handleCreateReminder}>
                  Enable Reminder
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
            <CardContent className="p-6 relative">
              <div className={cn("size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="size-6" />
              </div>
              <div className="text-3xl font-black tracking-tighter mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-none shadow-xl glass-card overflow-hidden">
            <CardHeader className="border-b bg-card/50 px-8 py-6 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Active Schedule</CardTitle>
                <CardDescription className="font-medium">Sequence of your manual and clinical reminders.</CardDescription>
              </div>
              <Activity className="size-6 text-primary animate-pulse" />
            </CardHeader>
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex justify-center py-20 opacity-20"><Loader2 className="size-12 animate-spin" /></div>
              ) : !reminders || reminders.length === 0 ? (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                  <BellOff className="size-16 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">No active reminders</p>
                  <p className="text-xs font-medium">Use the "New Reminder" button to start your schedule.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders.map((reminder, idx) => (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={reminder.id} className={cn("p-6 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6", reminder.isEnabled ? "bg-card border-border hover:border-primary/30" : "bg-muted/30 opacity-60 border-transparent")}>
                      <div className="flex items-center gap-5">
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center shadow-lg", reminder.isEnabled ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                          <Clock className="size-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{reminder.title}</h4>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px] font-bold py-0">{reminder.time}</Badge>
                             <span className="text-xs font-black text-muted-foreground uppercase tracking-widest truncate max-w-[150px]">{reminder.description || 'No notes'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant={reminder.isEnabled ? "outline" : "default"} size="sm" className="rounded-xl font-bold h-10 px-4" onClick={() => toggleReminder(reminder.id, reminder.isEnabled)}>
                          {reminder.isEnabled ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-destructive hover:bg-destructive/5" onClick={() => deleteReminder(reminder.id)}>
                          <Check className="size-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert className="size-32 rotate-12" /></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tighter uppercase">Clinical Shield</CardTitle>
              <CardDescription className="text-primary-foreground/80 font-medium">AI monitoring is active on all reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-3">
                  <span>Daily Precision</span>
                  <span>98%</span>
                </div>
                <Progress value={98} className="h-3 bg-white/10" indicatorClassName="bg-white" />
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/20 text-[10px] font-medium leading-relaxed italic">
                "Our predictive analysis suggests evening reminders have a 12% higher chance of being missed. Consider adding a companion notification."
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-black font-headline tracking-tight flex items-center gap-2 px-2">
              <Timer className="size-5 text-destructive" /> Critical Alerts (1)
            </h3>
            <div className="p-5 rounded-[2rem] border-2 border-destructive bg-destructive/5 shadow-sm flex gap-4 transition-all group">
              <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-destructive text-white shadow-md">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h5 className="font-black text-sm uppercase tracking-tighter text-destructive">Medication Conflict</h5>
                <p className="text-[11px] font-medium leading-relaxed opacity-80 text-destructive/80">You added a reminder for Aspirin, which may interact with your active blood pressure regimen.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest px-4 bg-destructive shadow-lg">Review Interaction</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
