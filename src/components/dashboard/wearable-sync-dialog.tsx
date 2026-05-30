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
  SmartphoneNfc,
  Activity,
  HeartPulse,
  Apple,
  Zap,
  Search,
  Rss,
  ShieldCheck,
  Stethoscope,
  Microscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface WearableSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (device: string) => void;
}

const PRESETS = [
  { id: 'apple', name: 'Apple Watch', icon: Apple, color: 'bg-black' },
  { id: 'garmin', name: 'Garmin Fenix', icon: Activity, color: 'bg-blue-600' },
  { id: 'fitbit', name: 'Fitbit Sense', icon: Zap, color: 'bg-teal-500' },
];

const DISCOVERED_MOCK = [
  { id: 'custom-1', name: 'Ultra-Health S3', strength: -65 },
  { id: 'custom-2', name: 'Biometric Ring v2', strength: -72 },
  { id: 'custom-3', name: 'Smart Band Pro', strength: -80 },
];

export function WearableSyncDialog({ open, onOpenChange, onConnect }: WearableSyncDialogProps) {
  const [step, setStep] = React.useState<'select' | 'scanning' | 'pairing' | 'diagnosing' | 'success'>('select');
  const [selectedDevice, setSelectedDevice] = React.useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = React.useState<typeof DISCOVERED_MOCK>([]);
  const { toast } = useToast();

  const getTitle = () => {
    switch(step) {
      case 'select': return 'Connect Wearable';
      case 'scanning': return 'Discovery Active';
      case 'pairing': return 'Clinical Pairing';
      case 'diagnosing': return 'Sensor Diagnosis';
      case 'success': return 'Telemetry Secured';
      default: return 'Wearable Sync';
    }
  };

  const handleStartScanning = async () => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        // @ts-ignore
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
        });
        handleStartPairing(device.name || "Unknown Wearable");
        return;
      } catch (error) {
        console.warn("Bluetooth scan failed/cancelled", error);
      }
    }

    setStep('scanning');
    setDiscoveredDevices([]);
    setTimeout(() => {
      setDiscoveredDevices(DISCOVERED_MOCK);
    }, 2500);
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
          description: `Telemetry link secured. Sensor diagnosis from ${device} is now live.`,
        });
        onConnect(device);
      }, 3500);
    }, 3000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('select');
      setSelectedDevice(null);
      setDiscoveredDevices([]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (step !== 'pairing' && step !== 'diagnosing') onOpenChange(v); }}>
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
              Link your smartwatch sensor for real-time medical diagnosis.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="grid gap-3">
                  {PRESETS.map((device) => (
                    <Button
                      key={device.id}
                      variant="outline"
                      className="h-16 rounded-2xl border-2 hover:border-primary/50 flex items-center justify-between px-6 group transition-all"
                      onClick={() => handleStartPairing(device.name)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("size-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", device.color)}>
                          <device.icon className="size-5" />
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight">{device.name}</span>
                      </div>
                      <Bluetooth className="size-4 text-muted-foreground opacity-30 group-hover:text-primary group-hover:opacity-100" />
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="h-16 rounded-2xl border-2 border-dashed hover:border-primary/50 flex items-center justify-center gap-3 group transition-all mt-2"
                    onClick={handleStartScanning}
                  >
                    <Bluetooth className="size-5 text-primary group-hover:animate-pulse" />
                    <span className="font-black text-sm uppercase tracking-tight">Access Device Bluetooth</span>
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'scanning' && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="relative mx-auto size-24 mb-6">
                    <motion.div 
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-primary/20 rounded-full"
                    />
                    <div className="relative z-10 size-24 bg-primary/10 rounded-full flex items-center justify-center">
                       <Search className="size-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Scanning Near By</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Polling local Bluetooth spectrum...</p>
                </div>

                <div className="space-y-3 min-h-[180px]">
                   {discoveredDevices.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
                        <Loader2 className="size-6 animate-spin mb-2" />
                        <span className="text-[10px] font-black uppercase">Identifying Smart Sensors...</span>
                     </div>
                   ) : (
                     discoveredDevices.map((device, idx) => (
                       <motion.button
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.1 }}
                         key={device.id}
                         onClick={() => handleStartPairing(device.name)}
                         className="w-full h-14 bg-muted/30 hover:bg-muted border border-transparent hover:border-primary/30 rounded-xl px-4 flex items-center justify-between group transition-all"
                       >
                         <div className="flex items-center gap-3">
                            <Rss className="size-4 text-primary" />
                            <span className="font-bold text-sm">{device.name}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="flex gap-0.5 items-end h-3">
                               {[1, 2, 3, 4].map(i => (
                                 <div key={i} className={cn("w-1 rounded-full", i <= 3 ? "bg-accent" : "bg-muted-foreground/20")} style={{ height: `${i * 25}%` }} />
                               ))}
                            </div>
                            <span className="text-[8px] font-black uppercase opacity-40">Pair & Diagnose</span>
                         </div>
                       </motion.button>
                     ))
                   )}
                </div>

                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest opacity-40" onClick={() => setStep('select')}>
                  Cancel Scan
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
                    <SmartphoneNfc className="size-12 text-primary" />
                  </motion.div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full"
                  />
                  <div className="absolute -top-2 -right-2">
                    <div className="size-8 bg-background border-2 border-primary rounded-full flex items-center justify-center shadow-xl">
                      <Bluetooth className="size-4 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Syncing {selectedDevice}</h3>
                  <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Handshaking Medical Protocol...
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
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                  >
                     <div className="w-48 h-48 border-4 border-accent/20 rounded-full border-t-accent animate-spin-slow" />
                  </motion.div>
                </div>
                
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Clinical Diagnosis</h3>
                  <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-accent">
                    <Activity className="size-3 animate-pulse" />
                    Extracting Sensor Biometrics...
                  </div>
                </div>

                <div className="w-full max-w-[250px] space-y-3">
                   <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                      <span>Sensor Calibration</span>
                      <span>92%</span>
                   </div>
                   <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ duration: 3 }}
                        className="h-full bg-accent"
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
                className="flex flex-col items-center justify-center py-12 text-center space-y-6"
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
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Sensor Active</h3>
                  <p className="text-sm font-medium text-muted-foreground px-8 leading-relaxed">
                    Medical diagnosis profile updated. Your clinical history is now synced with real-time reports from {selectedDevice}.
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="p-3 bg-muted rounded-2xl"><HeartPulse className="size-5 text-destructive" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Biometrics</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <div className="p-3 bg-muted rounded-2xl"><Stethoscope className="size-5 text-blue-500" /></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Diagnosis</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-accent/20 bg-accent hover:bg-accent/90"
                  onClick={handleClose}
                >
                  Confirm Sync
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}