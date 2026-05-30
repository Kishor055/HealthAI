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
import { useToast } from "@/hooks/use-toast";

/**
 * Premium Clinical Dashboard.
 * Designed with a high-fidelity aesthetic: large radii, clean typography, and real-time telemetry.
 */
export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
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
      
      if (result.trendInsight.includes("peak capacity")) {
        toast({
          title: "Intelligence Baseline Active",
          description: "AI engine is currently busy. Using clinical baseline for your health summary.",
        });
      }
    } catch (e) {
      console.error("AI Trend Analysis failed", e);
      toast({
        variant: "destructive",
        title: "Analysis Failure",
        description: "Clinical telemetry could not be generated. Using baseline defaults.",
      });
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
      className="flex min-h-screen w-full flex-col bg-slate-50/50 pb-20 md:pb-0 font-body"
    >
      <ReminderAlarm />
      
      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <TakeNowDialog open={isTakeNowOpen} onOpenChange={setIsTakeNowOpen} />
      <CallDoctorDialog open={isCallDoctorOpen} onOpenChange={setIsCallDoctorOpen} />
      <WearableSyncDialog open={isWearableOpen} onOpenChange={setIsWearableOpen} onConnect={handleDeviceConnect} />

      <div className="flex flex-col gap-8 p-4 sm:p-10 max-w-[1600px] mx-auto w-full">
        {/* Top Navigation & Identity Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-6 flex-1 w-full">
            <WelcomeHeader />
            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 mb-1.5 flex items-center gap-2">
                        <ClipboardCheck className="size-3" /> Daily Health Check-In
                      </h3>
                      <p className="text-sm font-bold text-foreground tracking-tight">How is your clinical state today?</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-4 py-1 border-2 transition-all rounded-full", selectedVibe ? "bg-accent/10 border-accent/20 text-accent" : "border-primary/10 text-primary/60")}>
                      {selectedVibe ? "Assessment Logged" : "Reading Pending"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4">
                    {checkIns.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setSelectedVibe(item.label)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border-2",
                          selectedVibe === item.label 
                            ? "border-primary bg-primary/5 shadow-xl scale-105" 
                            : "border-transparent hover:border-primary/10 bg-slate-50/50"
                        )}
                      >
                        <item.icon className={cn("size-7", item.color.split(' ')[0])} />
                        <span className="block text-[10px] font-black uppercase tracking-tighter text-foreground/70">{item.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       {selectedVibe ? `Last Telemetry: Just now` : "Last Telemetry: 14 hours ago"}
                     </p>
                     <Button variant="ghost" size="sm" className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary gap-2 hover:bg-primary/5 group">
                        Enter Detailed Symptoms <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 ml-2">Priority Shortcuts</h3>
            <QuickActions 
              onAddMed={() => setIsAddOpen(true)}
              onTakeNow={() => setIsTakeNowOpen(true)}
              onCallDoctor={() => setIsCallDoctorOpen(true)}
            />
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Schedules & Safety */}
          <div className="lg:col-span-8 space-y-8">
            <KpiCards />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                    <div className="size-2 bg-primary rounded-full animate-pulse" />
                    Intake Protocol
                  </h2>
                  <Badge className="bg-primary/5 text-primary border-none text-[9px] font-bold">NEXT 24H</Badge>
                </div>
                <Reminders />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                    <div className="size-2 bg-destructive rounded-full" />
                    Clinical Safety
                  </h2>
                  <Badge className="bg-destructive/5 text-destructive border-none text-[9px] font-bold">MONITOR ACTIVE</Badge>
                </div>
                <Alerts />
              </div>
            </div>
          </div>
          
          {/* Right Column: AI Insights & Devices */}
          <div className="lg:col-span-4 space-y-8">
             <MotivationalQuote />
             
             <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.06)] bg-white rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Brain className="size-32 -rotate-12" />
                </div>
                
                <CardContent className="p-8 space-y-8 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-xl uppercase tracking-tighter leading-none mb-1">Stability Index</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Calculated Clinical Baseline</p>
                    </div>
                    <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                       <TrendingUp className="size-6" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100 shadow-inner">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-4xl font-black tracking-tighter text-primary">
                          {connectedDevice ? (aiInsight?.stabilityIndex || 98) : 94}%
                        </span>
                        <span className="text-[10px] font-black uppercase text-accent mb-1.5 flex items-center gap-1">
                          <Activity className="size-3" /> Optimizing
                        </span>
                      </div>
                      <div className="flex gap-2 h-16 items-end">
                         {[60, 80, 100, 90, 100, 100, 100].map((h, i) => (
                           <motion.div 
                             key={i}
                             initial={{ height: 0 }}
                             animate={{ height: `${h}%` }}
                             transition={{ delay: 0.4 + (i * 0.05), type: "spring" }}
                             className={`flex-1 rounded-t-xl transition-colors ${h === 100 ? 'bg-accent/80' : 'bg-primary/20'}`}
                           />
                         ))}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-[2rem] border-2 border-primary/10">
                      <div className="size-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary/20">
                         <Sparkles className="size-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-tight text-primary mb-1.5">AI Adherence Summary</p>
                        <p className="text-xs font-medium leading-relaxed text-foreground/70 italic">
                          {aiInsight?.trendInsight ? `"${aiInsight.trendInsight}"` : connectedDevice ? '"Analyzing live biometric streams from your connected hardware..."' : '"Sync your sensor data to generate professional clinical insights based on recent patterns."'}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsWearableOpen(true)}
                      className="w-full p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:border-primary/20 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all shadow-xl", connectedDevice ? "bg-accent text-white shadow-accent/20" : "bg-white text-muted-foreground")}>
                          {connectedDevice ? <Wifi className="size-6 animate-pulse" /> : <Watch className="size-6" />}
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1.5">Connected Hardware</span>
                          <span className="text-sm font-black uppercase tracking-tight text-foreground">
                            {connectedDevice ? connectedDevice : "Scan for Sensors"}
                          </span>
                        </div>
                      </div>
                      <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full", connectedDevice ? "bg-accent text-white" : "bg-slate-200 text-slate-500")}>
                        {connectedDevice ? "Live" : "Ready"}
                      </Badge>
                    </button>

                    <Button 
                      onClick={handleRunAiCheck}
                      disabled={isAnalyzing || !vitals}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-3"
                    >
                      {isAnalyzing ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                      Generate AI Insight
                    </Button>
                  </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
      <SosButton />
    </motion.div>
  );
}
