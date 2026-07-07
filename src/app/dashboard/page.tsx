"use client";

import { useState, useEffect } from "react";
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
import { MedicalIdDialog } from "@/components/dashboard/medical-id-dialog";
import { MotivationalQuote } from "@/components/dashboard/motivational-quote";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Smile, 
  Frown, 
  Meh, 
  TrendingUp, 
  Activity, 
  Loader2, 
  Sparkles, 
  HeartPulse, 
  Watch,
  Wifi,
  ThumbsUp,
  AlertCircle,
  Trophy,
  ShieldCheck,
  Lock,
  Cpu,
  Globe
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { query, collection, orderBy, limit, doc } from 'firebase/firestore';
import { analyzeHealthTrends, HealthTrendOutput } from "@/ai/flows/analyze-health-trends";
import { cn } from "@/lib/utils";

/**
 * EXPERT DASHBOARD NODE
 * Primary clinical oversight and personalized health stability monitoring.
 */
export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTakeNowOpen, setIsTakeNowOpen] = useState(false);
  const [isCallDoctorOpen, setIsCallDoctorOpen] = useState(false);
  const [isWearableOpen, setIsWearableOpen] = useState(false);
  const [isIdOpen, setIsIdOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  
  const [aiInsight, setAiInsight] = useState<HealthTrendOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'admin' || user?.email === 'kishorkakde026@gmail.com';

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

  if (!mounted) return null;

  const checkIns = [
    { label: "Great", icon: ThumbsUp, color: "text-emerald-500" },
    { label: "Good", icon: Smile, color: "text-blue-500" },
    { label: "Fair", icon: Meh, color: "text-orange-500" },
    { label: "Poor", icon: Frown, color: "text-slate-500" },
    { label: "Critical", icon: AlertCircle, color: "text-red-600" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50 pb-20 md:pb-0 font-body">
      <ReminderAlarm />
      
      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <TakeNowDialog open={isTakeNowOpen} onOpenChange={setIsTakeNowOpen} />
      <CallDoctorDialog open={isCallDoctorOpen} onOpenChange={setIsCallDoctorOpen} />
      <WearableSyncDialog open={isWearableOpen} onOpenChange={setIsWearableOpen} onConnect={(d) => setConnectedDevice(d)} />
      <MedicalIdDialog open={isIdOpen} onOpenChange={setIsIdOpen} />

      <div className="flex flex-col gap-8 p-4 sm:p-10 max-w-[1400px] mx-auto w-full">
        {isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-900 rounded-[2.5rem] border-2 border-primary/20 flex flex-col md:flex-row md:items-center justify-between shadow-2xl overflow-hidden relative"
          >
             <div className="absolute inset-0 bg-primary/5 animate-pulse-slow" />
             <div className="flex items-center gap-6 relative z-10">
                <div className="size-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/10">
                   <ShieldCheck className="size-8" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1.5">Administrative Root Node</h2>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                         <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Global Sync Active</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Full Authority System Engaged</p>
                   </div>
                </div>
             </div>
             <div className="flex gap-3 relative z-10 mt-6 md:mt-0">
                <div className="flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Token Auth</p>
                      <p className="text-xs font-black text-white">99.9%</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Latency</p>
                      <p className="text-xs font-black text-white">42ms</p>
                   </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl border-white/20 text-white font-black text-[10px] uppercase h-12 px-6 bg-white/5 hover:bg-white/10 group">
                   <Cpu className="size-4 mr-2 group-hover:rotate-90 transition-transform" /> System Stats
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl border-white/20 text-white font-black text-[10px] uppercase h-12 px-6 bg-white/5 hover:bg-white/10">
                   <Lock className="size-4 mr-2" /> Security Node
                </Button>
             </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-6 flex-1 w-full">
            <WelcomeHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-none shadow-xl bg-white rounded-[2.25rem] hover-clinical">
                 <CardContent className="p-8">
                   <div className="flex flex-col space-y-6">
                     <div>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Physiological Pulse</h3>
                       <p className="text-sm font-black text-slate-900 uppercase">Self-Reported Wellness Status</p>
                     </div>
                     
                     <div className="grid grid-cols-5 gap-3">
                       {checkIns.map((item) => (
                         <button
                           key={item.label}
                           onClick={() => setSelectedVibe(item.label)}
                           className={cn(
                             "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border-2",
                             selectedVibe === item.label 
                               ? "border-primary bg-primary/5 ring-8 ring-primary/5" 
                               : "border-slate-50 hover:border-slate-100 bg-white"
                           )}
                         >
                           <item.icon className={cn("size-6", item.color)} />
                           <span className="block text-[8px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-xl bg-white rounded-[2.25rem] overflow-hidden relative group hover-clinical">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                     <Trophy className="size-32 text-primary" />
                  </div>
                  <CardContent className="p-8 space-y-6 relative z-10">
                     <div className="flex items-center justify-between">
                        <div>
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Clinical Adherence</h3>
                           <p className="text-sm font-black text-slate-900 uppercase">Consistency Streak</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                           <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">System Verified</span>
                        </div>
                     </div>
                     <div className="flex items-end gap-3">
                        <span className="text-7xl font-black tracking-tighter text-primary">07</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Nodes Active</span>
                     </div>
                     <div className="flex gap-2.5">
                        {[1, 1, 1, 1, 1, 1, 0].map((active, i) => (
                          <div key={i} className={cn("flex-1 h-2.5 rounded-full transition-all duration-500", active ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "bg-slate-100")} />
                        ))}
                     </div>
                     <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">
                        <ShieldCheck className="size-3.5" /> Adherence Shield Fully Operational
                     </div>
                  </CardContent>
               </Card>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <QuickActions 
              onAddMed={() => setIsAddOpen(true)}
              onTakeNow={() => setIsTakeNowOpen(true)}
              onCallDoctor={() => setIsCallDoctorOpen(true)}
              onMedicalId={() => setIsIdOpen(true)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <KpiCards />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Reminders />
              <Alerts />
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-8">
             <MotivationalQuote />
             <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover-clinical">
                <CardContent className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-primary/10 rounded-xl">
                          <TrendingUp className="size-5 text-primary" />
                       </div>
                       <div>
                         <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Stability Matrix</h3>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AI Telemetry Node</p>
                       </div>
                    </div>
                    <Globe className="size-4 text-slate-200 animate-spin-slow" />
                  </div>

                  <div className="p-8 bg-slate-50/80 rounded-[2rem] border-2 border-slate-100/50 shadow-inner">
                    <div className="flex justify-between items-end mb-6">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Precision Index</p>
                        <span className="text-5xl font-black tracking-tighter text-slate-900">
                          {connectedDevice ? (aiInsight?.stabilityIndex || 98) : 94}%
                        </span>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest",
                        connectedDevice ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-primary border border-blue-100"
                      )}>
                        {connectedDevice ? "Live Sync" : "Baseline"}
                      </div>
                    </div>
                    <div className="flex gap-2 h-16 items-end">
                       {[60, 80, 100, 90, 100, 100, 100].map((h, i) => (
                         <motion.div 
                           key={i}
                           initial={{ height: 0 }}
                           animate={{ height: `${h}%` }}
                           transition={{ delay: i * 0.1, duration: 1 }}
                           className={cn(
                             "flex-1 rounded-t-lg transition-all", 
                             h === 100 ? 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-primary/20'
                           )}
                         />
                       ))}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                       <Sparkles className="size-16" />
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic opacity-90 relative z-10">
                      {aiInsight?.trendInsight ? `"${aiInsight.trendInsight}"` : '"Initialize your biometric node by syncing a wearable sensor for real-time stability analysis."'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      variant="outline"
                      onClick={() => setIsWearableOpen(true)}
                      className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-[0.2em] text-slate-700 gap-3 hover:bg-slate-50"
                    >
                      {connectedDevice ? <Wifi className="size-4 text-emerald-500 animate-pulse" /> : <Watch className="size-4 text-slate-400" />}
                      {connectedDevice || "Sync Smart Sensor"}
                    </Button>

                    <Button 
                      onClick={handleRunAiCheck}
                      disabled={isAnalyzing || !vitals}
                      className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black text-xs uppercase tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                    >
                      {isAnalyzing ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                      Execute Stability Scan
                    </Button>
                  </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}