"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, BellRing, Check, BellOff, Loader2, AlertCircle, ShieldAlert, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export function ReminderAlarm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [hasPermission, setHasPermission] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{ medName: string; dosage: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setHasPermission(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") setHasPermission(true);
        });
      }
    }
  }, []);

  const triggerAlarm = useCallback((medName: string, dosage: string) => {
    setActiveAlarm({ medName, dosage });
    
    try {
      // Professional hospital-style chime
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {
      console.warn("Audio chime could not be played", e);
    }

    if (hasPermission) {
      new Notification(`Critical Dose: ${medName}`, {
        body: `Your ${dosage} dose is scheduled now. High priority alert.`,
        icon: '/favicon.ico'
      });
    }

    toast({
      title: "Medication Alarm",
      description: `Time for your ${medName} (${dosage})`,
      variant: "destructive",
    });
  }, [hasPermission, toast]);

  // Simulation: Trigger every 5 minutes for demo
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      if (now.getMinutes() % 5 === 0 && now.getSeconds() === 0 && !activeAlarm) {
        triggerAlarm("Lisinopril", "10mg");
      }
    };
    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [activeAlarm, triggerAlarm]);

  const handleConfirmTaken = async () => {
    if (!user || !firestore || !activeAlarm) return;
    setIsProcessing(true);
    try {
      addDocumentNonBlocking(collection(firestore, "users", user.uid, "medicationIntakes"), {
        userId: user.uid,
        medicineName: activeAlarm.medName,
        dosage: activeAlarm.dosage,
        scheduledTime: new Date().toISOString(),
        actualTakeTime: new Date().toISOString(),
        status: "taken",
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Dose Verified",
        description: `Your intake of ${activeAlarm.medName} has been recorded to your health record.`,
      });
      setActiveAlarm(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={!!activeAlarm} onOpenChange={(v) => !v && !isProcessing && setActiveAlarm(null)}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden border-none p-0 glass-card bg-background/90">
        <div className="h-2 w-full bg-primary absolute top-0 left-0 animate-pulse" />
        
        <div className="p-8 space-y-8">
          <DialogHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-6 relative group">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, -10, 10, 0] 
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="z-10"
              >
                <BellRing className="h-12 w-12 text-primary" />
              </motion.div>
              <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-ping" />
              <div className="absolute inset-2 border-2 border-dashed border-primary/30 rounded-[2rem] group-hover:rotate-180 transition-transform duration-1000" />
            </div>
            <DialogTitle className="text-4xl font-black tracking-tighter text-foreground uppercase">Dose Protocol</DialogTitle>
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              <ShieldAlert className="size-3" /> System Intervention Active
            </div>
          </DialogHeader>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-card p-6 rounded-[2.5rem] border-2 border-primary/20 flex items-center gap-6 shadow-2xl"
          >
            <div className="p-5 bg-primary text-primary-foreground rounded-[1.5rem] shadow-xl shadow-primary/20 shrink-0">
              <Pill className="size-10" />
            </div>
            <div className="min-w-0">
              <h3 className="text-3xl font-black uppercase leading-none mb-1 truncate tracking-tighter">{activeAlarm?.medName}</h3>
              <div className="flex items-center gap-1.5 text-sm font-black text-primary uppercase tracking-widest">
                <HeartPulse className="size-4 animate-pulse" />
                DUE NOW • {activeAlarm?.dosage}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 pt-4">
            <Button 
              size="lg" 
              className="h-20 text-2xl font-black bg-accent hover:bg-accent/90 text-accent-foreground rounded-[1.5rem] shadow-2xl shadow-accent/30 group relative overflow-hidden"
              onClick={handleConfirmTaken}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin h-8 w-8" />
              ) : (
                <div className="flex items-center gap-4">
                  <Check className="h-8 w-8 group-hover:scale-125 transition-transform" />
                  VERIFY INTAKE
                </div>
              )}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 font-black rounded-2xl border-2 hover:bg-muted"
                onClick={() => setActiveAlarm(null)}
                disabled={isProcessing}
              >
                <BellOff className="size-4 mr-2" />
                Snooze
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="h-14 font-black rounded-2xl text-destructive hover:bg-destructive/5"
                disabled={isProcessing}
              >
                Skip Dose
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
            Intake will be logged to your permanent medical history.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
