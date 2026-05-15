
"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, BellRing, Check, BellOff, Loader2, AlertCircle } from "lucide-react";
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
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {
      console.warn("Audio chime could not be played", e);
    }

    if (hasPermission) {
      new Notification(`Medication Due: ${medName}`, {
        body: `It is time for your ${dosage} dose. Please confirm intake.`,
        icon: '/favicon.ico'
      });
    }

    toast({
      title: "Medication Alarm",
      description: `Time for your ${medName} (${dosage})`,
      variant: "default",
    });
  }, [hasPermission, toast]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      
      // Active Simulation: Triggers every minute at 00 seconds for demo purposes
      if (seconds === 0 && !activeAlarm) {
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
        title: "Dose Confirmed",
        description: `Your ${activeAlarm.medName} intake has been logged successfully.`,
      });
      
      setActiveAlarm(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logging Failed",
        description: "Could not save your intake record.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={!!activeAlarm} onOpenChange={(v) => !v && !isProcessing && setActiveAlarm(null)}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-3xl shadow-2xl">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-2 w-full bg-primary absolute top-0 left-0"
        />
        
        <div className="p-8 space-y-6">
          <DialogHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, -10, 10, 0] 
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <BellRing className="h-12 w-12 text-primary" />
              </motion.div>
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">MEDICATION ALERT</DialogTitle>
            <DialogDescription className="text-base font-medium text-muted-foreground">
              Proactive health monitoring system active.
            </DialogDescription>
          </DialogHeader>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-card p-6 rounded-[2rem] border-2 border-primary/20 flex items-center gap-5 shadow-lg shadow-primary/5"
          >
            <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20">
              <Pill className="size-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase leading-none mb-1">{activeAlarm?.medName}</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
                <AlertCircle className="size-3" />
                DUE NOW • {activeAlarm?.dosage}
              </div>
            </div>
          </motion.div>

          <div className="grid gap-3 pt-4">
            <Button 
              size="lg" 
              className="h-18 text-xl font-black bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl shadow-xl shadow-accent/30 group relative overflow-hidden"
              onClick={handleConfirmTaken}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin h-7 w-7" />
              ) : (
                <div className="flex items-center gap-3">
                  <Check className="h-7 w-7 group-hover:scale-125 transition-transform" />
                  LOG INTAKE
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 font-bold rounded-2xl border-2 hover:bg-muted"
              onClick={() => setActiveAlarm(null)}
              disabled={isProcessing}
            >
              <BellOff className="size-4 mr-2" />
              Snooze (5m)
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-30">
            <Clock className="size-3" />
            Active Schedule Management
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
