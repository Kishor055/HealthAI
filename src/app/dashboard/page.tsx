
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smile, Frown, Meh, Thermometer, Brain } from "lucide-react";

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
            {/* Daily Check-in */}
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
                  Due Now
                </h2>
                <Reminders />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                  <span className="w-2 h-6 bg-destructive rounded-full" />
                  Health Shield
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
                className="bg-card rounded-[2rem] p-8 border shadow-sm relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Brain className="size-32 -rotate-12" />
                </div>
                <h3 className="font-black text-xl uppercase tracking-tighter mb-6">Clinical Adherence</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="font-bold">Last 7 Days</span>
                      <span className="text-accent">94% Stability</span>
                    </div>
                    <div className="flex gap-1.5 h-10 items-end">
                       {[60, 80, 100, 90, 100, 100, 100].map((h, i) => (
                         <motion.div 
                           key={i}
                           initial={{ height: 0 }}
                           animate={{ height: `${h}%` }}
                           transition={{ delay: 0.4 + (i * 0.05) }}
                           className={`flex-1 rounded-t-lg ${h === 100 ? 'bg-accent' : 'bg-primary/40'}`}
                         />
                       ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-dashed">
                    <Thermometer className="size-5 text-primary" />
                    <div className="text-[10px] font-bold leading-tight opacity-70">
                      Sync your wearable for real-time heart rate overlay.
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-8 text-center italic font-medium">
                  "Perfect streak! You haven't missed a dose in 5 days."
                </p>
             </motion.div>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}
