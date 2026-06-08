
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
import { 
  Contact, 
  ShieldCheck, 
  Droplets, 
  AlertCircle, 
  Phone, 
  Download, 
  User,
  HeartPulse,
  CheckCircle2
} from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface MedicalIdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicalIdDialog({ open, onOpenChange }: MedicalIdDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <ShieldCheck className="size-32" />
          </div>
          <div className="relative z-10 space-y-4">
             <div className="flex items-center justify-between">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none font-black text-[10px] tracking-widest uppercase px-3">Official Medical ID</Badge>
                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <HeartPulse className="size-6" />
                </div>
             </div>
             <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{profile?.displayName || user?.displayName || 'Patient Record'}</h2>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Reg ID: {user?.uid.substring(0, 12)}</p>
             </div>
          </div>
        </div>

        <div className="p-8 space-y-6 bg-slate-50/50">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                 <div className="flex items-center gap-2 text-primary mb-2">
                    <Droplets className="size-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Blood Type</span>
                 </div>
                 <p className="text-2xl font-black text-slate-900">{profile?.bloodType || 'O+'}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                 <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="size-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Allergies</span>
                 </div>
                 <p className="text-xs font-bold text-slate-900 leading-tight">{profile?.allergies || 'No Known Drug Allergies'}</p>
              </div>
           </div>

           <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Emergency Contact</h4>
              <div className="bg-slate-900 p-5 rounded-2xl text-white flex items-center justify-between group shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center">
                       <User className="size-6" />
                    </div>
                    <div>
                       <p className="font-black text-sm uppercase tracking-tight">{profile?.emergencyContactName || 'Family Contact'}</p>
                       <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Primary Guardian</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" className="size-10 rounded-full hover:bg-white/10" asChild>
                    <a href={`tel:${profile?.phone || '108'}`}>
                       <Phone className="size-5" />
                    </a>
                 </Button>
              </div>
           </div>

           <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                 This profile is encrypted and synced with the clinical database. In emergencies, provide this ID to clinical staff.
              </p>
           </div>

           <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2" onClick={handlePrint}>
                 <Download className="size-4 mr-2" /> Download Card
              </Button>
              <Button className="flex-[2] h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-primary shadow-xl shadow-primary/20" onClick={() => onOpenChange(false)}>
                 Close ID
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
