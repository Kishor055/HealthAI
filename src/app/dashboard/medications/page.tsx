
"use client";

import { useState } from "react";
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
import { PlusCircle, Loader2, Pill, Activity, Heart, Wind, AlertCircle, RefreshCw } from "lucide-react";
import { useCollection, useUser, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { AddMedicationDialog } from "@/components/medications/add-medication-dialog";

export default function MedicationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter">Pharmacy Center</h1>
          <p className="text-muted-foreground font-medium">Manage your active treatments and prescription refills.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl font-black h-12 px-6 shadow-lg shadow-primary/20">
          <PlusCircle className="mr-2 h-5 w-5" />
          Register Medication
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Active Medications</CardTitle>
            <CardDescription>
              AI-verified pharmaceutical list from your records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Medication</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Category</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Regimen</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 opacity-30">
                        <Pill className="size-12 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No medications registered</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {medications?.map((med) => (
                    <TableRow key={med.id} className="group transition-colors">
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Pill className="size-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tighter">{med.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{med.dosage}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(med.category)}
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{med.category || 'General'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold">{med.frequency}</p>
                        <p className="text-[10px] text-muted-foreground">Since {med.startDate}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={med.isActive ? "default" : "secondary"} className={med.isActive ? 'bg-accent text-accent-foreground font-black uppercase text-[9px] px-3' : 'font-black uppercase text-[9px]'}>
                          {med.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase text-destructive hover:bg-destructive/5" onClick={() => handleDelete(med.id)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-accent text-accent-foreground overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
               <RefreshCw className="size-24" />
             </div>
             <CardHeader>
               <CardTitle className="text-lg font-black uppercase tracking-tight">Refill Tracker</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span>Lisinopril</span>
                    <span>12 days left</span>
                  </div>
                  <Progress value={40} className="h-2 bg-white/20" indicatorClassName="bg-white" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span>Metformin</span>
                    <span>28 days left</span>
                  </div>
                  <Progress value={85} className="h-2 bg-white/20" indicatorClassName="bg-white" />
                </div>
                <Button variant="outline" className="w-full h-10 bg-white/10 border-white/20 font-black text-xs uppercase tracking-widest hover:bg-white/20">
                  Request Refills
                </Button>
             </CardContent>
          </Card>

          <Card className="border-none shadow-xl border-primary/20 bg-primary/5">
             <CardHeader>
               <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <AlertCircle className="size-4" /> Safety Protocol
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">
                  "Our AI is monitoring your combination of 4 active meds for potential interactions."
                </p>
                <div className="p-3 rounded-xl bg-white/50 border border-primary/10">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Clinical Shield Active</p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      <AddMedicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
