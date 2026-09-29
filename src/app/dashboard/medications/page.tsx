"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  PlusCircle, 
  Loader2, 
  Pill, 
  Activity, 
  Heart, 
  Wind, 
  AlertCircle, 
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  Trash2,
  FileCheck
} from "lucide-react";
import { useCollection, useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { AddMedicationDialog } from "@/components/medications/add-medication-dialog";
import { SafetyAuditDialog } from "@/components/medications/safety-audit-dialog";
import { cn } from "@/lib/utils";
import { evaluateMedicationSafety } from "@/lib/safety-gate";
import { logAuditEvent } from "@/lib/audit-logger";

export default function MedicationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [localTakenIds, setLocalTakenIds] = useState<Set<string>>(new Set(["med_demo_1"]));

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "medicines"),
      orderBy("startDate", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: rawMedications, isLoading } = useCollection(medsQuery);

  // Baseline fallback demo medications if user hasn't added any yet
  const medications = useMemo(() => {
    if (rawMedications && rawMedications.length > 0) return rawMedications;
    return [
      {
        id: "med_demo_1",
        name: "Metformin",
        dosage: "500 mg",
        frequency: "Twice daily",
        timeSlot: "morning",
        scheduledTime: "08:00 AM",
        instructions: "Take with breakfast",
        category: "Diabetes",
        isActive: true,
        refillRemaining: 18,
        totalQuantity: 60,
      },
      {
        id: "med_demo_2",
        name: "Amlodipine",
        dosage: "5 mg",
        frequency: "Once daily",
        timeSlot: "afternoon",
        scheduledTime: "01:00 PM",
        instructions: "Take after lunch",
        category: "BP",
        isActive: true,
        refillRemaining: 4, // Depletion warning
        totalQuantity: 30,
      },
      {
        id: "med_demo_3",
        name: "Atorvastatin",
        dosage: "20 mg",
        frequency: "Once daily",
        timeSlot: "evening",
        scheduledTime: "09:00 PM",
        instructions: "Take at bedtime",
        category: "Heart",
        isActive: true,
        refillRemaining: 24,
        totalQuantity: 30,
      },
    ];
  }, [rawMedications]);

  // Run deterministic drug safety audit
  const safetyAudit = useMemo(() => {
    const medNames = medications.map(m => m.name);
    return evaluateMedicationSafety(medNames);
  }, [medications]);

  const toggleTaken = (id: string, name: string) => {
    setLocalTakenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        logAuditEvent({
          userId: user?.uid || "guest",
          action: "MEDICATION_LOG_TAKEN",
          resourceId: id,
          details: { medication: name, timestamp: new Date().toISOString() },
        });
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "medicines", id);
    deleteDocumentNonBlocking(docRef);
  };

  const adherencePercentage = useMemo(() => {
    if (medications.length === 0) return 100;
    const takenCount = medications.filter(m => localTakenIds.has(m.id)).length;
    return Math.round((takenCount / medications.length) * 100);
  }, [medications, localTakenIds]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto font-body pb-24"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
              Pharmaceutical Care Module
            </Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Medication Schedule & Adherence
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Dose Tracking • Rule-Based Safety Shield • Refill Predictions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-11 text-xs font-bold gap-2 border-slate-200"
            onClick={() => setIsSafetyOpen(true)}
          >
            <ShieldCheck className="size-4 text-emerald-600" />
            Safety Audit ({safetyAudit.conflicts.length})
          </Button>
          <Button
            className="rounded-xl h-11 text-xs font-black uppercase tracking-wider gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md"
            onClick={() => setIsAddOpen(true)}
          >
            <PlusCircle className="size-4" />
            Add Medication
          </Button>
        </div>
      </div>

      {/* Deterministic Safety Gate Alert Banner */}
      {!safetyAudit.isSafe && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200 text-amber-900 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-900">
                Deterministic Drug Interaction Alert ({safetyAudit.conflicts.length} Warning)
              </h4>
              <p className="text-xs font-medium text-amber-800 mt-0.5">
                {safetyAudit.deterministicSummary}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider shrink-0"
            onClick={() => setIsSafetyOpen(true)}
          >
            Review Clinical Actions
          </Button>
        </motion.div>
      )}

      {/* Adherence & Depletion KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today&apos;s Adherence</p>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">{adherencePercentage}%</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> {localTakenIds.size} of {medications.length} doses logged
              </p>
            </div>
            <div className="size-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CalendarClock className="size-7 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Regimen</p>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">{medications.length} Therapies</h3>
              <p className="text-xs text-slate-500 font-semibold">
                Pharmacological Safety Index: {safetyAudit.safetyScore}/100
              </p>
            </div>
            <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Pill className="size-7 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refill Depletion</p>
              <h3 className="text-3xl font-black tracking-tight text-amber-600">
                {medications.filter(m => (m.refillRemaining || 20) <= 5).length} Pending
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Amlodipine 5mg: 4 days remaining
              </p>
            </div>
            <div className="size-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Package className="size-7 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Today's Medication Timeline ── */}
      <Card className="rounded-3xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black tracking-tight text-slate-900">
                Today&apos;s Medication Timeline
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                Daily Administration Schedule & One-Tap Compliance
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 text-xs font-bold">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {medications.map((med) => {
              const isTaken = localTakenIds.has(med.id);
              const daysLeft = med.refillRemaining || 14;
              return (
                <div
                  key={med.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                    isTaken
                      ? "bg-slate-50/80 border-slate-200/60 opacity-80"
                      : "bg-white border-slate-200 shadow-sm hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "size-12 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-inner",
                        isTaken
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {med.scheduledTime || "08:00 AM"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <h4 className="text-base font-black text-slate-900">
                          {med.name}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {med.dosage}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {med.instructions || "Take as directed by doctor"} • {med.frequency}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {daysLeft <= 5 ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                        Refill Soon ({daysLeft}d)
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {daysLeft} days supply
                      </span>
                    )}

                    <Button
                      size="sm"
                      variant={isTaken ? "outline" : "default"}
                      onClick={() => toggleTaken(med.id, med.name)}
                      className={cn(
                        "rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-wider transition-all",
                        isTaken
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                    >
                      {isTaken ? (
                        <>
                          <CheckCircle2 className="size-4 mr-1.5 text-emerald-600" /> Taken
                        </>
                      ) : (
                        "Mark Taken"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <SafetyAuditDialog 
        open={isSafetyOpen} 
        onOpenChange={setIsSafetyOpen} 
        medications={medications} 
      />
    </motion.div>
  );
}
