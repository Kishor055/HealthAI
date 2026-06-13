"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, BellRing, Check, BellOff, Loader2, HeartPulse } from "lucide-react";
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
import { motion } from "framer-motion";

export function ReminderAlarm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{ medName: string; dosage: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
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
    if (audioRef.current) {
      audioRef.current.play().catch(() => console.warn("Audio interaction pending user activity."));
    }

    if (hasPermission) {
      new Notification(`HEALTH ALERT: ${medName}`, {
        body: `CRITICAL DOSE: Your ${dosage} dose is scheduled now. Protocol compliance required.`,
        silent: false
      });
    }

    toast({
      title: "Clinical Dose Alert",
      description: `Protocol Intervention: Time for your ${medName} (${dosage})`,
      variant: "destructive",
    });
  }, [hasPermission, toast]);

  useEffect(() => {
    if (!mounted) return;
    const checkReminders = () => {
      const now = new Date();
      if (now.getMinutes() % 30 === 0 && now.getSeconds() === 0 && !activeAlarm) {
        triggerAlarm("Lisinopril", "10mg");
      }
    };
    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [activeAlarm, triggerAlarm, mounted]);

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
        title: "Clinical Intake Verified",
        description: `Your dose of ${activeAlarm.medName} has been synchronized.`,
      });
      setActiveAlarm(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Clinical Sync Interrupted" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <Dialog open={!!activeAlarm} onOpenChange={(v) => !v && !isProcessing && setActiveAlarm(null)}>
        <DialogContent className="sm:max-w-[480px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.2)] rounded-[3rem]">
          <div className="h-2.5 w-full bg-primary absolute top-0 left-0 animate-pulse" />
          
          <div className="p-10 space-y-8">
            <DialogHeader className="text-center">
              <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 relative group">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 5, -5, 5, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="z-10"
                >
                  <BellRing className="h-12 w-12 text-primary" />
                </motion.div>
                <div className="absolute inset-0 bg-primary/20 rounded-[2rem] animate-ping opacity-40" />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">Dose Protocol</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 mt-3">
                Clinical Intervention Service • High Priority
              </DialogDescription>
            </DialogHeader>

            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 flex items-center gap-8 shadow-inner">
              <div className="p-6 bg-primary text-primary-foreground rounded-[1.5rem] shadow-2xl shadow-primary/30 shrink-0">
                <Pill className="size-10" />
              </div>
              <div className="min-w-0">
                <h3 className="text-3xl font-black uppercase leading-none mb-2 truncate tracking-tighter text-slate-900">{activeAlarm?.medName}</h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  <HeartPulse className="size-4 animate-pulse" />
                  DUE NOW • {activeAlarm?.dosage}
                </div>
              </div>
            </div>

            <div className="grid gap-4 pt-4">
              <Button 
                size="lg" 
                className="h-24 text-2xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-500/30 group relative overflow-hidden transition-all active:scale-95"
                onClick={handleConfirmTaken}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin h-10 w-10" />
                ) : (
                  <div className="flex items-center gap-4">
                    <Check className="h-10 w-10 group-hover:scale-125 transition-transform" />
                    VERIFY INTAKE
                  </div>
                )}
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-16 font-black rounded-2xl border-2 text-[11px] uppercase tracking-widest hover:bg-slate-50"
                  onClick={() => setActiveAlarm(null)}
                  disabled={isProcessing}
                >
                  <BellOff className="size-4 mr-3" /> Snooze
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="h-16 font-black rounded-2xl text-destructive hover:bg-destructive/5 text-[11px] uppercase tracking-widest"
                  disabled={isProcessing}
                >
                  Skip Dose
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
