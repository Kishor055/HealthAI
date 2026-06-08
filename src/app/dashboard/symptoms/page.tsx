
"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thermometer, 
  Plus, 
  Activity, 
  Heart, 
  Loader2, 
  Clock, 
  AlertCircle,
  Pill,
  CheckCircle2,
  Trash2,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { query, collection, orderBy, limit, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function SymptomTrackerPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = React.useState(false);
  const [newSymptom, setNewSymptom] = React.useState({ 
    name: "", 
    severity: "low", 
    notes: "",
    relatedMed: "none"
  });

  const symptomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "symptoms"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [firestore, user?.uid]);

  const medsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "medicines"));
  }, [firestore, user?.uid]);

  const { data: symptoms, isLoading } = useCollection(symptomsQuery);
  const { data: medications } = useCollection(medsQuery);

  const handleLogSymptom = () => {
    if (!user || !firestore || !newSymptom.name) return;
    
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "symptoms"), {
      ...newSymptom,
      createdAt: new Date().toISOString(),
      userId: user.uid
    });

    toast({
      title: "Observation Logged",
      description: "Symptom data has been added to your clinical profile.",
    });

    setNewSymptom({ name: "", severity: "low", notes: "", relatedMed: "none" });
    setIsAdding(false);
  };

  const handleDeleteSymptom = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "symptoms", id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-10 space-y-10 pb-24 max-w-[1400px] mx-auto font-body"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-primary/10 rounded-xl">
               <Thermometer className="size-5 text-primary" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Clinical Monitoring</span>
           </div>
           <h1 className="text-4xl font-black tracking-tighter text-foreground">Symptom Journal</h1>
           <p className="text-muted-foreground font-medium">Track physiological changes and side-effect interactions.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="rounded-2xl font-black h-14 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
          <Plus className="size-5 mr-2" /> Log Physiological Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
           {isAdding && (
             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">New Log Entry</CardTitle>
                    <CardDescription>Detail the severity and potential medication relationship.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Observation / Symptom</Label>
                          <Input placeholder="e.g. Mild Dizziness" className="h-12 rounded-xl" value={newSymptom.name} onChange={(e) => setNewSymptom({...newSymptom, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Severity Level</Label>
                          <Select onValueChange={(v) => setNewSymptom({...newSymptom, severity: v})} defaultValue={newSymptom.severity}>
                             <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="low">Low (Noticeable)</SelectItem>
                                <SelectItem value="medium">Medium (Uncomfortable)</SelectItem>
                                <SelectItem value="high">High (Distressing)</SelectItem>
                                <SelectItem value="critical">Critical (Immediate Care)</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Related Medication (Optional)</Label>
                          <Select onValueChange={(v) => setNewSymptom({...newSymptom, relatedMed: v})} defaultValue={newSymptom.relatedMed}>
                             <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl border-none shadow-2xl">
                                <SelectItem value="none">No specific link</SelectItem>
                                {medications?.map(m => (
                                  <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes</Label>
                          <Input placeholder="Describe context (e.g. after morning dosage)" className="h-12 rounded-xl" value={newSymptom.notes} onChange={(e) => setNewSymptom({...newSymptom, notes: e.target.value})} />
                       </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                       <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2" onClick={() => setIsAdding(false)}>Cancel</Button>
                       <Button className="flex-[2] h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary shadow-xl shadow-primary/20" onClick={handleLogSymptom}>Commit to Journal</Button>
                    </div>
                  </CardContent>
                </Card>
             </motion.div>
           )}

           <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
             <CardHeader className="bg-slate-50 border-b p-8">
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                   <Activity className="size-6 text-primary" /> Physiological Timeline
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8">
                {isLoading ? (
                  <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin size-12" /></div>
                ) : !symptoms || symptoms.length === 0 ? (
                  <div className="text-center py-24 opacity-30 grayscale italic">
                     <Brain className="size-16 mx-auto mb-4" />
                     <p className="text-sm font-black uppercase tracking-widest">Journal is Clear</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {symptoms.map((symptom, idx) => (
                       <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: idx * 0.05 }} 
                        key={symptom.id} 
                        className="p-6 rounded-[2rem] border-2 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary transition-all group shadow-sm"
                       >
                          <div className="flex items-center gap-5">
                             <div className={cn(
                                "size-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                                symptom.severity === 'high' || symptom.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                             )}>
                                <Activity className="size-7" />
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <h4 className="text-xl font-black uppercase tracking-tighter leading-none">{symptom.name}</h4>
                                   <Badge variant={symptom.severity === 'high' || symptom.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[8px] font-black uppercase tracking-widest h-5">
                                      {symptom.severity}
                                   </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                      <Clock className="size-3" /> {formatDistanceToNow(new Date(symptom.createdAt), { addSuffix: true })}
                                   </span>
                                   {symptom.relatedMed !== 'none' && (
                                     <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">
                                        <Pill className="size-2.5 mr-1" /> {symptom.relatedMed}
                                     </Badge>
                                   )}
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <p className="text-xs font-medium italic opacity-60 max-w-[200px] truncate">{symptom.notes}</p>
                             <Button variant="ghost" size="icon" className="size-10 rounded-xl text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/5" onClick={() => handleDeleteSymptom(symptom.id)}>
                                <Trash2 className="size-4" />
                             </Button>
                          </div>
                       </motion.div>
                     ))}
                  </div>
                )}
             </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none bg-slate-900 text-white shadow-2xl rounded-[2.5rem] p-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:rotate-12 transition-transform duration-1000">
                 <Brain className="size-48 text-primary" />
              </div>
              <div className="relative z-10 space-y-6">
                 <h4 className="text-2xl font-black uppercase tracking-tighter">Clinical Context</h4>
                 <p className="text-sm font-medium leading-relaxed opacity-80 italic">
                    "AI Analysis: We correlate your symptoms with recent medication intakes to detect adverse patterns before they escalate."
                 </p>
                 <div className="p-5 bg-white/5 rounded-2xl border border-dashed border-white/20">
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                       <CheckCircle2 className="size-3" /> Monitoring Profile
                    </h5>
                    <p className="text-[11px] font-medium leading-relaxed opacity-70">
                       Currently monitoring for interactions between {medications?.length || 0} active treatments.
                    </p>
                 </div>
              </div>
           </Card>

           <Card className="border-none shadow-xl bg-white rounded-[2.5rem] p-8 space-y-6 border-2 border-slate-100">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                 <AlertCircle className="size-4 text-destructive" /> Red Flags
              </CardTitle>
              <div className="space-y-4">
                 <div className="p-5 rounded-2xl bg-destructive/5 border-2 border-destructive/10">
                    <h5 className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1">When to seek care</h5>
                    <p className="text-xs font-medium leading-relaxed opacity-70">Chest pain, severe shortness of breath, or sudden vision changes require immediate ER consultation.</p>
                 </div>
                 <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2" asChild>
                    <a href="/dashboard/chat">Ask Care Assistant</a>
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </motion.div>
  );
}
