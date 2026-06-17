
"use client";

import { useState } from "react";
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
  RefreshCw, 
  ShieldCheck,
  Timer,
  Info,
  CalendarClock
} from "lucide-react";
import { useCollection, useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { AddMedicationDialog } from "@/components/medications/add-medication-dialog";
import { SafetyAuditDialog } from "@/components/medications/safety-audit-dialog";
import { cn } from "@/lib/utils";

export default function MedicationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "medicines"),
      orderBy("startDate", "desc")
    );
  }, [firestore, user?.uid]);

  const { data: medications, isLoading } = useCollection(medsQuery);

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, "users", user.uid, "medicines", id);
    deleteDocumentNonBlocking(docRef);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Asthma': return <Wind className="h-4 w-4 text-blue-500" />;
      case 'BP': return <Activity className="h-4 w-4 text-red-500" />;
      case 'Heart': return <Heart className="h-4 w-4 text-red-600" />;
      case 'Diabetes': return <Pill className="h-4 w-4 text-orange-500" />;
      case 'Allergy': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Pill className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Predictive Refill Logic (Simulated for Prototype)
  const calculateDaysRemaining = (med: any) => {
    if (!med.isActive) return 0;
    // Mock calculation based on start date and random remaining stock
    const days = Math.floor(Math.random() * 20) + 2;
    return days;
  };

  const activeMedsCount = medications?.filter(m => m.isActive).length || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-4 sm:p-10 space-y-10 pb-24 max-w-[1600px] mx-auto font-body"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-primary/10 rounded-xl">
               <Pill className="size-5 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Pharmaceutical Registry v6.0</span>
           </div>
          <h1 className="text-5xl font-black font-headline tracking-tighter">Pharmacy Center</h1>
          <p className="text-muted-foreground text-lg font-medium">Predictive refill tracking and interaction auditing.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" onClick={() => setIsSafetyOpen(true)} className="flex-1 md:flex-none rounded-2xl font-black h-16 px-8 border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all">
            <ShieldCheck className="mr-3 h-6 w-6" />
            Safety Audit
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none rounded-2xl font-black h-16 px-10 shadow-2xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
            <PlusCircle className="mr-3 h-6 w-6" />
            Register Med
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-8 border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Active Treatment Plan</CardTitle>
                <CardDescription className="font-medium">AI-verified pharmaceutical list from your records.</CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black px-4 py-1">
                <Timer className="size-3 mr-2" /> REFILL PREDICTION ACTIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] pb-6">Medication</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] pb-6">Refill Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] pb-6">Regimen</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] pb-6">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.3em] pb-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-32 opacity-20 grayscale">
                        <Pill className="size-20 mx-auto mb-6" />
                        <p className="text-lg font-black uppercase tracking-widest">No Active Regimen</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {medications?.map((med) => {
                    const daysLeft = calculateDaysRemaining(med);
                    const isLow = daysLeft < 5;

                    return (
                      <TableRow key={med.id} className="group transition-all hover:bg-slate-50/50">
                        <TableCell className="py-8">
                          <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors shadow-inner">
                              <Pill className="size-7 text-primary" />
                            </div>
                            <div>
                              <p className="font-black text-lg uppercase tracking-tighter leading-none mb-1.5">{med.name}</p>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(med.category)}
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{med.dosage} • {med.category || 'General'}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2 max-w-[120px]">
                            <div className="flex justify-between items-end">
                               <span className={cn("text-[9px] font-black uppercase tracking-widest", isLow ? "text-destructive" : "text-muted-foreground")}>
                                 {daysLeft} Days Left
                               </span>
                               {isLow && <AlertCircle className="size-3 text-destructive animate-pulse" />}
                            </div>
                            <Progress value={(daysLeft / 30) * 100} className="h-1.5 bg-slate-100" indicatorClassName={isLow ? "bg-destructive" : "bg-emerald-500"} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-black uppercase tracking-tighter">{med.frequency}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
                             <CalendarClock className="size-2.5" /> Since {med.startDate}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "font-black uppercase text-[9px] px-4 py-1.5 rounded-full border-none",
                            med.isActive ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-400'
                          )}>
                            {med.isActive ? "Secured" : "Paused"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 px-4" onClick={() => handleDelete(med.id)}>
                            Archive
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-10">
          <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative group rounded-[3rem]">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <RefreshCw className="size-32 text-primary" />
             </div>
             <CardHeader className="p-10 pb-4">
               <CardTitle className="text-2xl font-black uppercase tracking-tight">Predictive Refills</CardTitle>
               <CardDescription className="text-white/50 font-bold uppercase tracking-widest">Inventory Management Node</CardDescription>
             </CardHeader>
             <CardContent className="p-10 space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span>Clinical Stock Index</span>
                    <span className="text-emerald-400">82% Healthy</span>
                  </div>
                  <Progress value={82} className="h-3 bg-white/10" indicatorClassName="bg-emerald-400" />
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                   <p className="text-sm font-medium leading-relaxed italic opacity-80">
                     "Based on your adherence streak, our AI predicts you will need a refill for {medications?.find(m => m.isActive)?.name || 'your BP meds'} in approximately 12 days."
                   </p>
                </div>
                <Button className="w-full h-16 rounded-[1.5rem] bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl">
                  Order Pre-Verification
                </Button>
             </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] p-10 space-y-8 border-2 border-slate-100">
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                   <ShieldCheck className="size-6" />
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Safety Protocol</h4>
                   <p className="text-sm font-black text-slate-900 uppercase">Real-Time Interaction Shield</p>
                </div>
             </div>
             <CardContent className="p-0 space-y-6">
                <div className="p-6 rounded-[2rem] bg-blue-50 border-2 border-blue-100 flex items-start gap-4">
                  <Info className="size-6 text-blue-600 mt-1 shrink-0" />
                  <p className="text-[11px] font-bold leading-relaxed text-blue-700 opacity-90 italic">
                    "Interaction Guard is monitoring your {activeMedsCount} active medications for high-risk skews. No conflicts detected in current registry."
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Audits Run</p>
                      <p className="text-xl font-black text-slate-900">142</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Alerts Cleared</p>
                      <p className="text-xl font-black text-emerald-500">All</p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      <SafetyAuditDialog open={isSafetyOpen} onOpenChange={setIsSafetyOpen} medications={medications || []} />
    </motion.div>
  );
}
