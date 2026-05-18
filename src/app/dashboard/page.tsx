"use client";

import { useState } from "react";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { Reminders } from "@/components/dashboard/reminders";
import { Alerts } from "@/components/dashboard/alerts";
import { SosButton } from "@/components/dashboard/sos-button";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ReminderAlarm } from "@/components/dashboard/reminder-alarm";
import { AddMedicationDialog } from "@/components/medications/add-medication-dialog";
import { TakeNowDialog } from "@/components/dashboard/take-now-dialog";
import { CallDoctorDialog } from "@/components/dashboard/call-doctor-dialog";
import { WearableSyncDialog } from "@/components/dashboard/wearable-sync-dialog";
import { MotivationalQuote } from "@/components/dashboard/motivational-quote";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Smile, 
  Frown, 
  Meh, 
  Brain, 
  TrendingUp, 
  Activity, 
  Loader2, 
  Sparkles, 
  HeartPulse, 
  Watch,
  Wifi,
  ClipboardCheck,
  ThumbsUp,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, orderBy, limit } from 'firebase/firestore';
import { analyzeHealthTrends, HealthTrendOutput } from "@/ai/flows/analyze-health-trends";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTakeNowOpen, setIsTakeNowOpen] = useState(false);
  const [isCallDoctorOpen, setIsCallDoctorOpen] = useState(false);
  const [isWearableOpen, setIsWearableOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  
  const [aiInsight, setAiInsight] = useState<HealthTrendOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const vitalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "healthRecords"), orderBy("date", "desc"), limit(5));
  }, [firestore, user?.uid]);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "medicines"), limit(10));
  }, [firestore, user?.uid]);

  const { data: vitals } = useCollection(vitalsQuery);
  const { data: medicines } = useCollection(medsQuery);

  const handleRunAiCheck = async () => {
    if (!vitals || !medicines) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeHealthTrends({
        vitals: vitals.map(v => ({ type: v.type, value: v.value, date: v.date })),
        activeMedications: medicines.filter(m => m.isActive).map(m => m.name),
      });
      setAiInsight(result);
    } catch (e) {
      console.error("AI Trend Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeviceConnect = (device: string) => {
    setConnectedDevice(device);
    if (vitals && medicines) {
      handleRunAiCheck();
    }
  };

  const checkIns = [
    { label: "Great", icon: ThumbsUp, color: "text-emerald-500 bg-emerald-500/5", desc: "Energy is high" },
    { label: "Good", icon: Smile, color: "text-blue-500 bg-blue-500/5", desc: "Standard state" },
    { label: "Fair", icon: Meh, color: "text-orange-500 bg-orange-500/5", desc: "Slight fatigue" },
    { label: "Poor", icon: Frown, color: "text-destructive bg-destructive/5", desc: "Symptoms active" },
    { label: "Critical", icon: AlertCircle, color: "text-red-700 bg-red-700/5", desc: "Need support" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex min-h-screen w-full flex-col bg-muted/30 pb-20 md:pb-0 font-body"
    >
      <ReminderAlarm />
      
      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <TakeNowDialog open={isTakeNowOpen} onOpenChange={setIsTakeNowOpen} />
      <CallDoctorDialog open={isCallDoctorOpen} onOpenChange={setIsCallDoctorOpen} />
      <WearableSyncDialog open={isWearableOpen} onOpenChange={setIsWearableOpen} onConnect={handleDeviceConnect} />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-6 flex-1 w-full">
            <WelcomeHeader />
            <Card className="border-none shadow-xl glass-card max-w-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
                        <ClipboardCheck className="size-4" /> Daily Health Check-In
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground italic">Your input helps refine your AI stability index.</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-3 border-2 transition-all", selectedVibe ? "bg-accent/10 border-accent text-accent" : "border-primary/20 text-primary")}>
                      {selectedVibe ? "Assessment Complete" : "Pending Log"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {checkIns.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setSelectedVibe(item.label)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                          selectedVibe === item.label 
                            ? "border-primary bg-primary/5 shadow-lg scale-105" 
                            : "border-transparent hover:border-muted-foreground/20 bg-muted/30"
                        )}
                      >
                        <item.icon className={cn("size-6", item.color.split(' ')[0])} />
                        <div className="text-center">
                          <span className="block text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-dashed">
                     <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                       {selectedVibe ? `Last Logged: Just now` : "Last log: Yesterday, 8:45 PM"}
                     </p>
                     <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-primary gap-1 group">
                        Log Detailed Symptoms <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <QuickActions 
            onAddMed={() => setIsAddOpen(true)}
            onTakeNow={() => setIsTakeNowOpen(true)}
            onCallDoctor={() => setIsCallDoctorOpen(true)}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <KpiCards />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  Upcoming Intake
                </h2>
                <Reminders />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                  <span className="w-2 h-6 bg-destructive rounded-full" />
                  Safety Monitor
                </h2>
                <Alerts />
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
             <MotivationalQuote />
             
             <div className="bg-card rounded-[2rem] p-8 border-none shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Brain className="size-32 -rotate-12" />
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tighter">Clinical Adherence</h3>
                  <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-none font-black text-[10px] tracking-widest uppercase">AI Verified</Badge>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="p-4 bg-muted/50 rounded-2xl border border-dashed border-primary/20">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-muted-foreground">
                      <span>7-Day Stability Index</span>
                      <span className="text-accent flex items-center gap-1">
                        <TrendingUp className="size-3" /> {connectedDevice ? (aiInsight?.stabilityIndex || 98) : 94}% Rate
                      </span>
                    </div>
                    <div className="flex gap-1.5 h-16 items-end">
                       {[60, 80, 100, 90, 100, 100, 100].map((h, i) => (
                         <motion.div 
                           key={i}
                           initial={{ height: 0 }}
                           animate={{ height: `${h}%` }}
                           transition={{ delay: 0.4 + (i * 0.05), type: "spring" }}
                           className={`flex-1 rounded-t-lg transition-colors ${h === 100 ? 'bg-accent shadow-[0_-4px_10px_rgba(16,185,129,0.2)]' : 'bg-primary/30'}`}
                         />
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
                    <Activity className="size-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-primary mb-1">Smart Adherence Insight</p>
                      <p className="text-[10px] font-medium leading-relaxed opacity-70 italic">
                        {aiInsight?.trendInsight ? `"${aiInsight.trendInsight}"` : connectedDevice ? '"Analyzing live telemetry from your wearable..."' : '"Sync your biometric data to generate professional clinical insights based on your recent records."'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsWearableOpen(true)}
                    className="w-full p-4 rounded-2xl bg-muted/30 border border-muted flex items-center justify-between hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("size-8 rounded-lg flex items-center justify-center transition-all", connectedDevice ? "bg-accent text-white" : "bg-muted-foreground/10 text-muted-foreground")}>
                        {connectedDevice ? <Wifi className="size-4 animate-pulse" /> : <Watch className="size-4" />}
                      </div>
                      <div className="text-left">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Wearable Sync</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-foreground">
                          {connectedDevice ? connectedDevice : "Disconnect / Connect"}
                        </span>
                      </div>
                    </div>
                    <Badge variant={connectedDevice ? "default" : "outline"} className={cn("text-[8px] font-black uppercase border-dashed", connectedDevice && "bg-accent hover:bg-accent")}>
                      {connectedDevice ? "Active Overlay" : "Ready to Pair"}
                    </Badge>
                  </button>

                  <div className="pt-2">
                    <Button 
                      onClick={handleRunAiCheck}
                      disabled={isAnalyzing || !vitals}
                      variant="ghost" 
                      className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all gap-2"
                    >
                      {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-primary" />}
                      {aiInsight ? "Refresh AI Insight" : "Generate Clinical Analysis"}
                    </Button>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
             </div>
          </div>
        </div>
      </div>
      <SosButton />
    </motion.div>
  );
}