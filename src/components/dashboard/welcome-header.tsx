
"use client";

import { useUser } from "@/firebase";
import { useLanguage } from "@/context/language-context";
import { HeartPulse, Calendar, ShieldCheck, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Premium Personal Identity Header.
 */
export function WelcomeHeader() {
  const { user } = useUser();
  const { t } = useLanguage();
  
  // Handle guest vs known users
  const isGuest = !user?.email || user.email === "guest@healthai.internal";
  const firstName = user?.displayName?.split(' ')[0] || (isGuest ? "Guest" : "there");
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-1">
           <div className="p-2 bg-primary/10 rounded-xl">
             <HeartPulse className="size-5 text-primary" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">HealthAI Clinical Portal</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-foreground">
          {t.welcomeBack}, <span className="text-primary">{firstName}</span>.
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {t.healthCheckIn} — <span className="text-accent flex items-center gap-1 font-bold"><ShieldCheck className="size-3" /> System Verified</span>
          </p>
          {isGuest && (
             <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full border border-border">
                <UserCircle className="size-3 text-muted-foreground" />
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Guest Node</span>
             </div>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm"
      >
        <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
           <Calendar className="size-5 text-slate-400" />
        </div>
        <div className="text-right">
           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Clinical Date</p>
           <p className="text-xs font-black uppercase tracking-tight text-foreground">{today}</p>
        </div>
      </motion.div>
    </div>
  );
}
