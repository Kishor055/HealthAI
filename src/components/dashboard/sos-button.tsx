
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
    
    // Simulate emergency sequence
    setTimeout(() => setStep(2), 1000);
    setTimeout(() => setStep(3), 2000);
    setTimeout(() => {
      setIsActivating(false);
      setIsOpen(false);
      setStep(0);
      toast({
        title: "Emergency Protocol Active",
        description: "Local authorities and your physician have been alerted with your coordinates.",
      });
    }, 3500);
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-18 w-18 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] bg-destructive hover:bg-destructive/90 transition-all p-0 border-4 border-white/30"
          suppressHydrationWarning
        >
          <div className="relative">
            <AlertTriangle className="h-8 w-8 text-white animate-pulse" />
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          </div>
        </Button>
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-destructive text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter whitespace-nowrap">
          Emergency Key
        </span>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={(v) => !isActivating && setIsOpen(v)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-xl">
          <div className="h-2 w-full bg-destructive absolute top-0 left-0" />
          
          <div className="p-8 space-y-6">
            <DialogHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4 relative">
                <ShieldAlert className="h-10 w-10 text-destructive" />
                {isActivating && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-destructive border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  />
                )}
              </div>
              <DialogTitle className="text-3xl font-black text-destructive tracking-tighter">EMERGENCY SOS</DialogTitle>
              <DialogDescription className="text-base font-medium">
                Activating this protocol will broadcast your medical profile and location to dispatchers.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <Button 
                size="lg" 
                variant="destructive" 
                className="h-20 text-xl font-black uppercase tracking-widest shadow-2xl shadow-destructive/30 rounded-2xl relative overflow-hidden group"
                onClick={handleSOS}
                disabled={isActivating}
                suppressHydrationWarning
              >
                <AnimatePresence mode="wait">
                  {isActivating ? (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-xs font-normal normal-case mb-1">
                        {step === 1 && "Verifying GPS..."}
                        {step === 2 && "Transmitting Bio-Data..."}
                        {step === 3 && "Connecting Services..."}
                      </span>
                      <Loader2 className="animate-spin h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div key="idle" className="flex items-center gap-3">
                      <Phone className="h-6 w-6" />
                      Activate Signal
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              
              {!isActivating && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 font-bold border-2 rounded-2xl"
                  onClick={() => setIsOpen(false)}
                  suppressHydrationWarning
                >
                  Dismiss
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-4">
               <div className="flex flex-col items-center gap-1 opacity-50">
                  <Wifi className="size-4" />
                  <span className="text-[10px] font-bold">Encrypted</span>
               </div>
               <div className="flex flex-col items-center gap-1 opacity-50">
                  <MapPin className="size-4" />
                  <span className="text-[10px] font-bold">GPS: ON</span>
               </div>
               <div className="flex flex-col items-center gap-1 opacity-50">
                  <X className="size-4" />
                  <span className="text-[10px] font-bold">One-Tap</span>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
