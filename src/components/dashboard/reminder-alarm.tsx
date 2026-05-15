
"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, Clock, BellRing, Check, BellOff, Loader2 } from "lucide-react";
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
    
    // Play a soft medical chime if possible
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {/* Blocked by browser policy until interaction */});
    } catch (e) {
      console.warn("Audio chime could not be played", e);
    }

    // Show system notification if permitted
    if (hasPermission) {
      new Notification(`Medication Due: ${medName}`, {
        body: `It is time for your ${dosage} dose. Please confirm intake.`,
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
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // For the prototype, we trigger an alarm every 5 minutes at the start of the minute
      if (minutes % 5 === 0 && seconds === 0 && !activeAlarm) {
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
      <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-2xl shadow-2xl">
        <div className="h-2 w-full bg-primary absolute top-0 left-0 animate-pulse" />
        
        <div className="p-8 space-y-6">
          <DialogHeader className="text-center">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 relative">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <BellRing className="h-12 w-12 text-primary" />
              </motion.div>
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter">MEDICATION ALARM</DialogTitle>
            <DialogDescription className="text-base font-medium">
              Your health schedule requires attention.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 p-6 rounded-2xl border-2 border-primary/20 flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Pill className="size-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase leading-tight">{activeAlarm?.medName}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{activeAlarm?.dosage} • Scheduled Now</p>
            </div>
          </div>

          <div className="grid gap-3 pt-4">
            <Button 
              size="lg" 
              className="h-16 text-lg font-black bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl shadow-xl shadow-accent/20 group"
              onClick={handleConfirmTaken}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <div className="flex items-center gap-3">
                  <Check className="h-6 w-6 group-hover:scale-125 transition-transform" />
                  CONFIRM TAKEN
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 font-bold rounded-2xl border-2"
              onClick={() => setActiveAlarm(null)}
              disabled={isProcessing}
            >
              <BellOff className="size-4 mr-2" />
              Dismiss / Snooze
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
            <Clock className="size-3" />
            Check your schedule for more details
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
