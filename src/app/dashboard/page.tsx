
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <WelcomeHeader />
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
             <div className="bg-card rounded-2xl p-6 border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Adherence Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Lisinopril</span>
                      <span className="font-semibold">100%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Metformin</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      <SosButton />
    </div>
  );
}
