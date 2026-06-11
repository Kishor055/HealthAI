
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
  Trophy,
  ShieldCheck,
  ChevronRight,
  Zap,
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { query, collection, orderBy, limit, doc } from 'firebase/firestore';
import { analyzeHealthTrends, HealthTrendOutput } from "@/ai/flows/analyze-health-trends";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
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
    { label: "Great", icon: ThumbsUp, color: "text-emerald-500 bg-emerald-50" },
    { label: "Good", icon: Smile, color: "text-blue-500 bg-blue-50" },
    { label: "Fair", icon: Meh, color: "text-orange-500 bg-orange-50" },
    { label: "Poor", icon: Frown, color: "text-slate-500 bg-slate-50" },
    { label: "Critical", icon: AlertCircle, color: "text-red-600 bg-red-50" },
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
            className="p-4 bg-slate-900 rounded-3xl border-2 border-primary/20 flex items-center justify-between shadow-2xl overflow-hidden relative"
          >
             <div className="absolute inset-0 bg-primary/5 animate-pulse" />
             <div className="flex items-center gap-4 relative z-10">
                <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                   <ShieldCheck className="size-6" />
                </div>
                <div>
                   <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1">Administrative Node Active</h2>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Root Authority System Engaged • Global Changes Active</p>
                </div>
             </div>
             <div className="flex gap-2 relative z-10">
                <Button size="sm" variant="outline" className="rounded-xl border-white/20 text-white font-black text-[10px] uppercase h-10 px-6 bg-white/5 hover:bg-white/10">
                   <Activity className="size-3 mr-2" /> Global Stats
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl border-white/20 text-white font-black text-[10px] uppercase h-10 px-6 bg-white/5 hover:bg-white/10">
                   <Lock className="size-3 mr-2" /> Security Log
                </Button>
             </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-6 flex-1 w-full">
            <WelcomeHeader />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-none shadow-sm bg-white rounded-3xl">
                 <CardContent className="p-8">
                   <div className="flex flex-col space-y-6">
                     <div>
                       <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Daily Health Check-In</h3>
                       <p className="text-sm font-semibold text-slate-900">How are you feeling today?</p>
                     </div>
                     
                     <div className="grid grid-cols-5 gap-3">
                       {checkIns.map((item) => (
                         <button
                           key={item.label}
                           onClick={() => setSelectedVibe(item.label)}
                           className={cn(
                             "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border",
                             selectedVibe === item.label 
                               ? "border-primary bg-primary/5 ring-4 ring-primary/5" 
                               : "border-slate-100 hover:border-slate-200 bg-white"
                           )}
                         >
                           <item.icon className={cn("size-6", item.color.split(' ')[0])} />
                           <span className="block text-[10px] font-bold uppercase text-slate-500">{item.label}</span>
                         </button>
                       ))}
                     </div>
                   </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                     <Trophy className="size-24 text-primary" />
                  </div>
                  <CardContent className="p-8 space-y-6 relative z-10">
                     <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Consistency Streak</h3>
                        <p className="text-sm font-semibold text-slate-900">You're on a roll!</p>
                     </div>
                     <div className="flex items-end gap-3">
                        <span className="text-6xl font-black tracking-tighter text-primary">07</span>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Days Active</span>
                     </div>
                     <div className="flex gap-2">
                        {[1, 1, 1, 1, 1, 1, 0].map((active, i) => (
                          <div key={i} className={cn("flex-1 h-2 rounded-full", active ? "bg-primary" : "bg-slate-100")} />
                        ))}
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <ShieldCheck className="size-3" /> Adherence Shield Active
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
             <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Health Insight</h3>
                      <p className="text-xs text-slate-400">AI stability telemetry</p>
                    </div>
                    <TrendingUp className="size-5 text-primary" />
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-3xl font-bold text-slate-900">
                        {connectedDevice ? (aiInsight?.stabilityIndex || 98) : 94}%
                      </span>
                      <span className="text-[10px] font-bold text-primary uppercase">Stability Index</span>
                    </div>
                    <div className="flex gap-1.5 h-12 items-end">
                       {[60, 80, 100, 90, 100, 100, 100].map((h, i) => (
                         <div 
                           key={i}
                           style={{ height: `${h}%` }}
                           className={`flex-1 rounded-t-sm transition-all ${h === 100 ? 'bg-primary' : 'bg-primary/20'}`}
                         />
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-600">
                    {aiInsight?.trendInsight ? `"${aiInsight.trendInsight}"` : '"Connect a wearable to see live insights."'}
                  </div>

                  <Button 
                    variant="outline"
                    onClick={() => setIsWearableOpen(true)}
                    className="w-full h-12 rounded-xl border-slate-200 font-bold text-slate-700 gap-2"
                  >
                    {connectedDevice ? <Wifi className="size-4 text-primary animate-pulse" /> : <Watch className="size-4" />}
                    {connectedDevice || "Sync Smartwatch"}
                  </Button>

                  <Button 
                    onClick={handleRunAiCheck}
                    disabled={isAnalyzing || !vitals}
                    className="w-full h-12 rounded-xl bg-primary text-white font-bold gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Refresh AI Analysis
                  </Button>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}
