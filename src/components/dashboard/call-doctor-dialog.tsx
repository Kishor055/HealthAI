"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Phone, 
  User, 
  Loader2, 
  HeartPulse, 
  Plus, 
  ArrowLeft, 
  UserPlus, 
  Stethoscope, 
  Mail,
  ShieldCheck
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { query, collection, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CallDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDoctorDialog({ open, onOpenChange }: CallDoctorDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [view, setView] = React.useState<'list' | 'add'>('list');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    specialty: "",
    phone: "",
    email: ""
  });

  const providersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: preferredProviders, isLoading } = useCollection(providersQuery);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !formData.name || !formData.phone) return;
    
    setIsSubmitting(true);
    try {
      addDocumentNonBlocking(collection(firestore, "users", user.uid, "preferredProviders"), {
        userId: user.uid,
        providerName: formData.name,
        providerSpecialty: formData.specialty || "General Practitioner",
        providerPhone: formData.phone,
        providerEmail: formData.email,
        savedAt: new Date().toISOString(),
        isManual: true,
      });

      toast({
        title: "Doctor Registered",
        description: `${formData.name} added to your clinical directory.`,
      });
      
      setFormData({ name: "", specialty: "", phone: "", email: "" });
      setView('list');
    } catch (error) {
      toast({ variant: "destructive", title: "Registration Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if(!v) setView('list'); }}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-[2.5rem]">
        <div className="h-1.5 w-full bg-primary/20 absolute top-0 left-0" />
        
        <div className="p-8 space-y-6">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <HeartPulse className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground">
              {view === 'list' ? 'Healthcare Directory' : 'Register Provider'}
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Connect with your primary care team or emergency services.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {view === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 clinical-scrollbar">
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
                    onClick={() => setView('add')}
                  >
                    <Plus className="size-4 text-primary group-hover:scale-125 transition-transform" />
                    <span className="font-black text-xs uppercase tracking-widest">Register Professional</span>
                  </Button>

                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                    </div>
                  ) : preferredProviders && preferredProviders.length > 0 ? (
                    preferredProviders.map((provider) => (
                      <div key={provider.id} className="p-5 rounded-3xl border-2 bg-card/50 hover:border-primary/40 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                              <User className="size-6" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm uppercase tracking-tighter leading-none mb-1">{provider.providerName}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{provider.providerSpecialty}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20" asChild>
                            <a href={`tel:${provider.providerPhone}`}>
                              <Phone className="size-3 mr-2" /> Call Now
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-2" asChild disabled={!provider.providerEmail}>
                            <a href={`mailto:${provider.providerEmail}`}>
                              <Mail className="size-3 mr-2" /> Email
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-30">
                       <Stethoscope className="size-12 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em]">Care Network Empty</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-dashed">
                   <Button variant="destructive" className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-destructive/20" asChild>
                      <a href="tel:108">
                        <HeartPulse className="size-5 mr-3" /> Dial Ambulance
                      </a>
                   </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="add"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                   <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setView('list')}>
                      <ArrowLeft className="size-5" />
                   </Button>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">New Entry</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manual Registry Protocol</p>
                   </div>
                </div>

                <form onSubmit={handleAddDoctor} className="space-y-5">
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Full Professional Name</Label>
                        <Input 
                          placeholder="e.g. Dr. Sarah Jenkins" 
                          className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Clinical Specialty</Label>
                        <Input 
                          placeholder="e.g. Cardiologist" 
                          className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                          value={formData.specialty}
                          onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Contact Phone</Label>
                          <Input 
                            type="tel"
                            placeholder="Primary line" 
                            className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Email Address</Label>
                          <Input 
                            type="email"
                            placeholder="Optional" 
                            className="h-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                   </div>

                   <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                      <ShieldCheck className="size-5 text-primary" />
                      <p className="text-[10px] font-medium leading-tight opacity-70">
                        This contact will be encrypted and synced to your private Healthcare Directory.
                      </p>
                   </div>

                   <Button 
                    type="submit" 
                    className="w-full h-16 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20"
                    disabled={isSubmitting}
                   >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <><UserPlus className="size-5 mr-3" /> Save to Care Team</>}
                   </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}