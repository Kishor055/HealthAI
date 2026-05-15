
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Loader2, X, ShieldAlert, Wifi, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function SosButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [step, setStep] = useState(0);
  const { toast } = useToast();

  const handleSOS = () => {
    setIsActivating(true);
    setStep(1);
    
    setTimeout(() => setStep(2), 1000);
    setTimeout(() => setStep(3), 2000);
    setTimeout(() => {
      setIsActivating(false);
      setIsOpen(false);
      setStep(0);
      toast({
        title: "Emergency Protocol Active",
        description: "Your physician and emergency contacts have been notified of your location.",
        variant: "destructive"
      });
    }, 3500);
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-20 w-20 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.6)] bg-destructive hover:bg-destructive/90 transition-all p-0 border-4 border-white/40 group overflow-hidden"
          suppressHydrationWarning
        >
          <div className="relative z-10">
            <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
          </div>
          <motion.div 
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-white rounded-full"
          />
        </Button>
        <motion.span 
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-destructive text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter whitespace-nowrap shadow-xl"
        >
          SOS SIGNAL
        </motion.span>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={(v) => !isActivating && setIsOpen(v)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-3xl shadow-2xl">
          <div className="h-2 w-full bg-destructive absolute top-0 left-0" />
          
          <div className="p-8 space-y-6">
            <DialogHeader className="text-center">
              <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6 relative">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                {isActivating && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-destructive border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  />
                )}
                <div className="absolute inset-0 bg-destructive/5 rounded-full animate-ping" />
              </div>
              <DialogTitle className="text-4xl font-black text-destructive tracking-tighter">EMERGENCY SOS</DialogTitle>
              <DialogDescription className="text-base font-bold text-muted-foreground">
                Broadcasting medical profile and real-time location.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <Button 
                size="lg" 
                variant="destructive" 
                className="h-24 text-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-destructive/40 rounded-[2rem] relative overflow-hidden group"
                onClick={handleSOS}
                disabled={isActivating}
                suppressHydrationWarning
              >
                <AnimatePresence mode="wait">
                  {isActivating ? (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] font-bold normal-case tracking-widest opacity-80 uppercase">
                        {step === 1 && "Locking GPS..."}
                        {step === 2 && "Transmitting Bio-Signature..."}
                        {step === 3 && "Connecting Dispatch..."}
                      </span>
                      <Loader2 className="animate-spin h-8 w-8" />
                    </motion.div>
                  ) : (
                    <motion.div key="idle" className="flex items-center gap-4">
                      <Phone className="h-8 w-8" />
                      ACTIVATE
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              
              {!isActivating && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 font-black border-2 rounded-2xl hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                  suppressHydrationWarning
                >
                  DISMISS SIGNAL
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-6 border-t border-dashed">
               <div className="flex flex-col items-center gap-1.5 opacity-60">
                  <div className="p-2 bg-muted rounded-full">
                    <Wifi className="size-4" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Secure</span>
               </div>
               <div className="flex flex-col items-center gap-1.5 opacity-60">
                  <div className="p-2 bg-muted rounded-full">
                    <MapPin className="size-4" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">GPS Live</span>
               </div>
               <div className="flex flex-col items-center gap-1.5 opacity-60">
                  <div className="p-2 bg-muted rounded-full">
                    <X className="size-4" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Quick Kill</span>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
