"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, UserCircle, Loader2, ArrowRight, HeartPulse } from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleGuestAccess = async () => {
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      const profileRef = doc(firestore, "users", user.uid);
      setDocumentNonBlocking(profileRef, {
        id: user.uid,
        email: "guest@healthai.internal",
        role: "user",
        displayName: "Guest User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      try {
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (syncErr) {
        console.warn("Background session sync pending.");
      }

      toast({ 
        title: "Guest Session Active", 
        description: "Clinical portal established. Routing to secure environment." 
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Access Interrupted", 
        description: "Unable to establish clinical connection. Please retry." 
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-slate-900 font-body selection:bg-primary/30">
      
      {/* Left pane: Enterprise Branding */}
      <div className="hidden lg:flex relative overflow-hidden bg-slate-950 flex-col p-12 xl:p-16 text-white justify-center items-start">
         <div className="absolute inset-0 z-0">
           <Image
             src="https://images.unsplash.com/photo-1551076805-e18690c5e53b?q=80&w=2000&auto=format&fit=crop"
             alt="Modern clinical hospital environment"
             fill
             className="object-cover opacity-20 mix-blend-luminosity"
             priority
           />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
         </div>

         <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
         
         <div className="relative z-10 max-w-2xl">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-8">
               <ShieldCheck className="size-3.5" /> Enterprise Grade
           </div>
           
           <h1 className="text-5xl xl:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              The Future of<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-emerald-400">Clinical Care.</span>
           </h1>
           <p className="text-slate-400 text-lg xl:text-xl font-medium leading-relaxed mb-12 max-w-lg">
              HealthAI PRO unifies biometric telemetry, automated RAG triage, and stringent RBAC security into a single pane of glass for modern healthcare providers.
           </p>

           <div className="flex items-center gap-8 border-l-2 border-primary/30 pl-6">
              <div>
                 <div className="text-3xl font-black text-white">99.9%</div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">System Uptime</div>
              </div>
              <div>
                 <div className="text-3xl font-black text-white">SOC2</div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Compliant Hub</div>
              </div>
              <div>
                 <div className="text-3xl font-black text-white">&lt;50ms</div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Telemetry Sync</div>
              </div>
           </div>
         </div>
      </div>
      
      {/* Right pane: Auth Gateway */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[440px]"
        >
          <div className="flex flex-col items-center text-center mb-12">
            <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-2xl shadow-primary/20 mb-6 border border-white/50">
               <HeartPulse className="size-8 text-white" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">HealthAI<span className="text-primary">PRO</span></h2>
            <p className="text-slate-500 font-medium">Select your portal entry method to continue.</p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/login')}
              className="w-full h-16 rounded-2xl text-base font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="flex items-center gap-3">
                Secure Institutional Login <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleGuestAccess}
              disabled={loading}
              className="w-full h-16 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-bold uppercase tracking-widest text-slate-700 transition-all"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin text-slate-400" />
              ) : (
                <span className="flex items-center gap-3">
                  <UserCircle className="size-5 text-slate-400" /> Enter Sandbox Guest Mode
                </span>
              )}
            </Button>
          </div>

          <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
            <Zap className="size-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-blue-800/80 leading-relaxed">
              Protected by Enterprise-Grade RBAC. All telemetry data is sandboxed per user session.
            </p>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
}
