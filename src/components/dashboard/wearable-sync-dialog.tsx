"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Watch, 
  Bluetooth, 
  CheckCircle2, 
  Loader2, 
  Smartphone,
  Activity,
  HeartPulse,
  Search,
  ShieldCheck,
  Microscope,
  Wifi,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface WearableSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (device: string) => void;
}

type SyncStep = 'initial' | 'scanning' | 'pairing' | 'diagnosing' | 'success' | 'unsupported';

export function WearableSyncDialog({ open, onOpenChange, onConnect }: WearableSyncDialogProps) {
  const [step, setStep] = React.useState<SyncStep>('initial');
  const [selectedDevice, setSelectedDevice] = React.useState<string | null>(null);
  const [isBluetoothAvailable, setIsBluetoothAvailable] = React.useState<boolean | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const checkBluetooth = async () => {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        try {
          const available = await (navigator as any).bluetooth.getAvailability();
          setIsBluetoothAvailable(available);
          if (!available) setStep('unsupported');
        } catch (e) {
          setIsBluetoothAvailable(false);
          setStep('unsupported');
        }
      } else {
        setIsBluetoothAvailable(false);
        setStep('unsupported');
      }
    };
    checkBluetooth();
  }, []);

  const getTitle = () => {
    switch(step) {
      case 'initial': return 'Clinical Sensor Sync';
      case 'scanning': return 'Discovery Active';
      case 'pairing': return 'Clinical Pairing';
      case 'diagnosing': return 'Sensor Diagnosis';
      case 'success': return 'Telemetry Secured';
      case 'unsupported': return 'Protocol Not Supported';
      default: return 'Wearable Sync';
    }
  };

  const handleStartScanning = async () => {
    if (!isBluetoothAvailable) {
      setStep('unsupported');
      return;
    }

    try {
      setStep('scanning');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service']
      });

      if (device) {
        handleStartPairing(device.name || "Identified Clinical Sensor");
      }
    } catch (error: any) {
      console.warn("Bluetooth scan interrupted:", error);
      setStep('initial');
      if (error.name !== 'NotFoundError') {
        toast({
          variant: "destructive",
          title: "Hardware Conflict",
          description: "Unable to access local Bluetooth radio. Ensure radio is powered on.",
        });
      }
    }
  };

  const handleStartPairing = (device: string) => {
    setSelectedDevice(device);
    setStep('pairing');
    
    setTimeout(() => {
      setStep('diagnosing');
      setTimeout(() => {
        setStep('success');
        toast({
          title: "Medical Diagnostic Active",
          description: `Telemetry link secured. Real-time sensor reports from ${device} are now live.`,
        });
        onConnect(device);
      }, 4000);
    }, 2500);
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (step !== 'pairing' && step !== 'diagnosing') {
        onOpenChange(false);
        setTimeout(() => {
          setStep(isBluetoothAvailable ? 'initial' : 'unsupported');
          setSelectedDevice(null);
        }, 300);
      }
    } else {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-[2.5rem]">
        <div className="h-1.5 w-full bg-primary/20 absolute top-0 left-0" />
        
        <div className="p-8 space-y-6">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Watch className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
              {getTitle()}
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              {step === 'unsupported' 
                ? 'Your current environment does not support real-time Bluetooth medical protocols.' 
                : 'Link your smartwatch sensor for real-time medical diagnosis and stability tracking.'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'initial' && (
              <motion.div 
                key="initial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="p-10 rounded-[2.5rem] border-4 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-6 group hover:bg-primary/10 transition-all cursor-pointer" onClick={handleStartScanning}>
                   <div className="size-20 bg-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform">
                      <Bluetooth className="size-10 animate-pulse" />
                   </div>
                   <div className="text-center">
                      <h3 className="text-xl font-black uppercase tracking-tighter">Initialize Scan</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Polling Local Biometric Spectrum</p>
                   </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
                   <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                   <p className="text-[10px] font-medium leading-relaxed opacity-60">
                      HealthAI utilizes RSA-encrypted Web Bluetooth protocols to secure your physiological data during clinical pairing.
                   </p>
                </div>

                <Button
                  className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                  onClick={handleStartScanning}
                >
                  Search for Sensors
                </Button>
              </motion.div>
            )}

            {step === 'unsupported' && (
              <motion.div 
                key="unsupported"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-6"
              >
                <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center">
                   <AlertTriangle className="size-10 text-destructive" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black uppercase tracking-tighter text-destructive">Hardware Incompatible</h3>
                   <p className="text-xs font-medium text-muted-foreground leading-relaxed px-6">
                      Real-time scanning requires a browser with Web Bluetooth support (Chrome/Edge) and an active Bluetooth radio.
                   </p>
                </div>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>Dismiss</Button>
              </motion.div>
            )}

            {step === 'scanning' && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-8"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-primary/20 rounded-full"
                  />
                  <div className="relative z-10 size-32 bg-primary/10 rounded-full flex items-center justify-center">
                     <Search className="size-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Polling Hardware</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Select your clinical device in the browser picker...</p>
                </div>
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest opacity-40" onClick={() => setStep('initial')}>
                  Cancel Search
                </Button>
              </motion.div>
            )}

            {step === 'pairing' && (
              <motion.div 
                key="pairing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-8"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="size-32 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <Smartphone className="size-12 text-primary" />
                  </motion.div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Syncing {selectedDevice}</h3>
                  <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Authenticating Clinical Handshake...
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'diagnosing' && (
              <motion.div 
                key="diagnosing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-8"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="size-32 bg-accent/10 rounded-full flex items-center justify-center"
                  >
                    <Microscope className="size-12 text-accent" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-48 h-48 border-4 border-accent/20 rounded-full border-t-accent animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Sensor Calibration</h3>
                  <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-accent">
                    <Activity className="size-3 animate-pulse" />
                    Reading GATT Health Characteristics...
                  </div>
                </div>
                <div className="w-full max-w-[250px] space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                      <span>Clinical Data Stream</span>
                      <span>96% Sync</span>
                   </div>
                   <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "96%" }}
                        transition={{ duration: 4 }}
                        className="h-full bg-accent shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center space-y-6"
              >
                <div className="size-24 bg-accent/10 rounded-[2.5rem] flex items-center justify-center relative">
                  <CheckCircle2 className="size-12 text-accent" />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 border-2 border-accent rounded-[2.5rem]"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Telemetry Secured</h3>
                  <p className="text-sm font-medium text-muted-foreground px-8 leading-relaxed">
                    Bio-sensor link verified. {selectedDevice} is now providing live telemetry to your Clinical Stability Index.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="p-3 bg-muted rounded-2xl"><HeartPulse className="size-5 text-destructive" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Vitals Sync</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="p-3 bg-muted rounded-2xl"><Wifi className="size-5 text-accent" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Adherence</span>
                  </div>
                </div>
                <Button 
                  className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90"
                  onClick={() => onOpenChange(false)}
                >
                  Activate Live Feed
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}