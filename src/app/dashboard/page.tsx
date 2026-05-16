
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
import { MotivationalQuote } from "@/components/dashboard/motivational-quote";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smile, Frown, Meh, Thermometer, Brain, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTakeNowOpen, setIsTakeNowOpen] = useState(false);
  const [isCallDoctorOpen, setIsCallDoctorOpen] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  const checkIns = [
    { icon: Smile, label: "Good", color: "text-accent bg-accent/10" },
    { icon: Meh, label: "Neutral", color: "text-blue-500 bg-blue-500/10" },
    { icon: Frown, label: "Poor", color: "text-destructive bg-destructive/10" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30 pb-20 md:pb-0">
      <ReminderAlarm />
      
      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <TakeNowDialog open={isTakeNowOpen} onOpenChange={setIsTakeNowOpen} />
      <CallDoctorDialog open={isCallDoctorOpen} onOpenChange={setIsCallDoctorOpen} />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
          <div className="space-y-6 flex-1">
            <WelcomeHeader />
            <Card className="border-none shadow-xl glass-card max-w-xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-1">Condition Monitor</h3>
                    <p className="text-xs font-medium text-muted-foreground">How are you feeling this morning?</p>
                  </div>
                  <div className="flex gap-3">
                    {checkIns.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        size="icon"
                        className={`size-12 rounded-2xl transition-all ${selectedVibe === item.label ? 'ring-2 ring-primary scale-110 shadow-lg' : 'hover:scale-105'} ${item.color}`}
                        onClick={() => setSelectedVibe(item.label)}
                      >
                        <item.icon className="size-6" />
                      </Button>
                    ))}
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
        </motion.div>
        
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
             
             <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-[2rem] p-8 border-none shadow-xl relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Brain className="size-32 -rotate-12" />
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tighter">Clinical Adherence</h3>
                  <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-none font-black text-[10px] tracking-widest uppercase">Verified</Badge>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="p-4 bg-muted/50 rounded-2xl border border-dashed border-primary/20">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-muted-foreground">
                      <span>7-Day Stability Index</span>
                      <span className="text-accent flex items-center gap-1"><TrendingUp className="size-3" /> 94% Rate</span>
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
                      <p className="text-[10px] font-medium leading-relaxed opacity-70">
                        "Perfect streak! You haven't missed a dose in 5 days. Your biometric baseline has stabilized significantly."
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all">
                      Sync Wearable Data
                    </Button>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20" />
             </motion.div>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}
