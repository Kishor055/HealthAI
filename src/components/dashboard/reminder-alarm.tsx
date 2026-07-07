"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Pill, BellRing, Check, Loader2, HeartPulse, Volume2, Sparkles } from "lucide-react";
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
import { answerMedicationQuestions } from "@/ai/flows/answer-medication-questions";

export function ReminderAlarm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{ medName: string; dosage: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiInstruction, setAiInstruction] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsRef = useRef<HTMLAudioElement | null>(null);

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
      // Professional schedule mock: trigger every 30 mins on the dot
      if (now.getMinutes() % 30 === 0 && now.getSeconds() === 0 && !activeAlarm) {
        triggerAlarm("Lisinopril", "10mg");
      }
    };
    const interval = setInterval(checkReminders, 1000);
    return () => clearInterval(interval);
  }, [activeAlarm, triggerAlarm, mounted]);

  const handleSpeakInstructions = async () => {
    if (!activeAlarm || isSpeaking) return;
    setIsSpeaking(true);
    
    try {
      const result = await answerMedicationQuestions({
        medicationList: `${activeAlarm.medName} (${activeAlarm.dosage})`,
        question: `Provide a 10 second voice instruction for taking ${activeAlarm.medName}. Include food requirements.`,
        generateAudio: true
      });

      if (result.audioDataUri && ttsRef.current) {
        setAiInstruction(result.answer);
        ttsRef.current.src = result.audioDataUri;
        ttsRef.current.play();
      }
    } catch (e) {
      console.warn("TTS Synthesis failed", e);
    } finally {
      setIsSpeaking(false);
    }
  };

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
      setAiInstruction(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Clinical Sync Interrupted" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) {
      setActiveAlarm(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="contents">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <audio ref={ttsRef} className="hidden" />
      <Dialog 
        open={!!activeAlarm} 
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="sm:max-w-[550px] overflow-hidden border-none p-0 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.2)] rounded-[3.5rem]">
          <div className="h-3 w-full bg-primary absolute top-0 left-0 animate-pulse" />
          
          <div className="p-12 space-y-10">
            <DialogHeader className="text-center">
              <div className="mx-auto w-28 h-28 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative group">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 5, -5, 5, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="z-10"
                >
                  <BellRing className="h-14 w-14 text-primary" />
                </motion.div>
                <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-ping opacity-40" />
              </div>
              <DialogTitle className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">Dose Protocol</DialogTitle>
              <DialogDescription className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/60 mt-4">
                Clinical Intervention Service • High Priority
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 flex items-center gap-10 shadow-inner group transition-all hover:bg-white hover:border-primary/20">
                <div className="p-8 bg-primary text-primary-foreground rounded-[2rem] shadow-2xl shadow-primary/30 shrink-0 group-hover:rotate-6 transition-transform">
                  <Pill className="size-12" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-4xl font-black uppercase leading-none mb-3 truncate tracking-tighter text-slate-900">{activeAlarm?.medName}</h3>
                  <div className="flex items-center gap-3 text-[12px] font-black text-primary uppercase tracking-[0.3em]">
                    <HeartPulse className="size-5 animate-pulse" />
                    DUE NOW • {activeAlarm?.dosage}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {aiInstruction && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-8 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles className="size-16" /></div>
                      <div className="flex items-center gap-3 mb-3">
                         <Volume2 className="size-4 text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">AI Voice Instruction</span>
                      </div>
                      <p className="text-sm font-bold leading-relaxed italic text-slate-700">"{aiInstruction}"</p>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid gap-5 pt-4">
              <Button 
                size="lg" 
                className="h-28 text-3xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2.5rem] shadow-2xl shadow-emerald-500/40 group relative overflow-hidden transition-all active:scale-95"
                onClick={handleConfirmTaken}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin h-12 w-12" />
                ) : (
                  <div className="flex items-center gap-6">
                    <Check className="h-12 w-12 group-hover:scale-125 transition-transform" />
                    VERIFY INTAKE
                  </div>
                )}
              </Button>
              <div className="grid grid-cols-2 gap-5">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-20 font-black rounded-3xl border-2 text-xs uppercase tracking-[0.3em] hover:bg-slate-50 transition-all gap-3"
                  onClick={handleSpeakInstructions}
                  disabled={isSpeaking || isProcessing}
                >
                  {isSpeaking ? <Loader2 className="size-5 animate-spin" /> : <Volume2 className="size-5 text-primary" />} 
                  Speech Mode
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="h-20 font-black rounded-3xl text-destructive hover:bg-destructive/5 text-xs uppercase tracking-[0.3em] transition-all"
                  onClick={() => { setActiveAlarm(null); }}
                  disabled={isProcessing}
                >
                  Snooze Protocol
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
