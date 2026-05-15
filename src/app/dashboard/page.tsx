
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

export default function DashboardPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTakeNowOpen, setIsTakeNowOpen] = useState(false);
  const [isCallDoctorOpen, setIsCallDoctorOpen] = useState(false);

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
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <WelcomeHeader />
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
                  Upcoming Reminders
                </h2>
                <Reminders />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                  <span className="w-2 h-6 bg-destructive rounded-full" />
                  Health Alerts
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
                className="bg-card rounded-2xl p-6 border shadow-sm relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <span className="text-6xl font-black">7D</span>
                </div>
                <h3 className="font-bold text-lg mb-4">Adherence Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Lisinopril</span>
                      <span className="font-black text-accent">100%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="h-full bg-accent" 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Metformin</span>
                      <span className="font-black text-primary">85%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        className="h-full bg-primary" 
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-6 text-center italic">
                  "You're doing great! Keep up the consistent schedule."
                </p>
             </motion.div>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}
