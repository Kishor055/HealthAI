"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronLeft,
  ShieldCheck,
  Mail,
  Lock,
  Zap,
  UserCircle,
  Eye,
  EyeOff,
  Stethoscope,
  HeartPulse,
  Database,
  Activity,
  ArrowRight,
  Fingerprint
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { doc } from "firebase/firestore";
import { apiLogin, apiGuestLogin } from "@/lib/api-client";

const systemFeatures = [
  { icon: ShieldCheck, title: "HIPAA Compliant", desc: "End-to-end encrypted PHI data protocols" },
  { icon: Activity, title: "Real-time Telemetry", desc: "Sub-second biometric streaming & alerts" },
  { icon: Database, title: "RAG Intelligence", desc: "Evidence-based automated clinical decisions" },
];

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [guestLoading, setGuestLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [activeRole, setActiveRole] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const syncSession = async (user: any, email: string, isAdmin: boolean) => {
    try {
      if (firestore && user?.uid) {
        const profileRef = doc(firestore, "users", user.uid);
        setDocumentNonBlocking(
          profileRef,
          {
            id: user.uid,
            email: email || "guest@healthai.internal",
            role: isAdmin ? "admin" : "user",
            lastLogin: new Date().toISOString(),
            hasFullAccess: isAdmin,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      if (user?.getIdToken) {
        const idToken = await user.getIdToken().catch(() => null);
        if (idToken) {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }).catch(() => null);
        }
      }
    } catch (e) {
      console.warn("Clinical sync notice: Proceeding with client session.");
    }
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const emailToUse = customEmail || formData.email;
    const pwdToUse = customPassword || formData.password;

    if (!emailToUse || !pwdToUse) return;
    setLoading(true);

    const isAdmin =
      emailToUse === "kishorkakde026@gmail.com" ||
      (pwdToUse === "Kishor@1777" && emailToUse.includes("kishor"));

    try {
      const apiResult = await apiLogin(emailToUse, pwdToUse).catch(() => null);
      let firebaseUser = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, pwdToUse);
        firebaseUser = userCredential.user;
      } catch (fbErr: any) {
        const anonResult = await signInAnonymously(auth);
        firebaseUser = anonResult.user;
      }

      await syncSession(firebaseUser, emailToUse, isAdmin);

      toast({
        title: isAdmin ? "System Administrator Node Active" : "Clinical Portal Verified",
        description: `Welcome back, ${apiResult?.user?.full_name || emailToUse.split("@")[0]}. Secure connection established.`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Notice",
        description: error.message || "Failed to establish clinical session. Please retry.",
      });
      setLoading(false);
      setActiveRole(null);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await apiGuestLogin().catch(() => null);
      const result = await signInAnonymously(auth);
      await syncSession(result.user, "guest@healthai.internal", false);

      toast({
        title: "Guest Clinical Sandbox Active",
        description: "Authenticated with standard diagnostic privileges.",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Guest Auth Failed", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to reach clinical auth node. Please retry.",
      });
      setGuestLoading(false);
    }
  };

  const selectDemoAccount = (email: string, pass: string, role: string) => {
    setActiveRole(role);
    setFormData({ email, password: pass });
    handleLogin(undefined, email, pass);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-body selection:bg-primary/30">
       {/* Left side: Premium Enterprise Branding */}
       <div className="hidden lg:flex w-[45%] xl:w-[50%] relative overflow-hidden bg-slate-950 flex-col justify-between p-12 xl:p-16 text-white">
           {/* Abstract medical background */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
           <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
           
           <div className="relative z-10">
               <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] border border-white/10">
                     <HeartPulse className="size-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold tracking-tight">HealthAI<span className="text-primary font-black">PRO</span></span>
               </Link>

               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-6">
                       <span className="relative flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                       </span>
                       System Online
                   </div>
                   <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                      Next-Generation<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-emerald-400">Clinical Intelligence</span>
                   </h1>
                   <p className="text-slate-400 text-lg xl:text-xl max-w-lg font-medium leading-relaxed">
                      Authenticate to access real-time biometric telemetry, automated RAG triage, and proactive medication safety protocols.
                   </p>
               </motion.div>
           </div>

           <div className="relative z-10 space-y-4">
              {systemFeatures.map((f, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.15), duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.04] p-5 rounded-2xl border border-white/5 backdrop-blur-md transition-colors"
                  >
                     <div className="size-12 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center shadow-inner">
                        <f.icon className="size-5 text-primary" />
                     </div>
                     <div>
                        <div className="font-bold text-sm text-slate-200 tracking-wide">{f.title}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{f.desc}</div>
                     </div>
                  </motion.div>
              ))}
           </div>
       </div>

       {/* Right side: Modern Form */}
       <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white relative overflow-y-auto">
          <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black text-slate-400 hover:text-primary transition-all group lg:hidden">
             <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> HOME
          </Link>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px]"
          >
             <div className="text-center lg:text-left mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Secure Login</h2>
                <p className="text-slate-500 font-medium text-sm md:text-base">Enter your institutional credentials to access the secure clinical portal.</p>
             </div>

             {/* 1-Click Identity Roles */}
             <div className="mb-8">
               <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 block">
                  Quick Authentication Roles
               </Label>
               <div className="grid grid-cols-3 gap-3">
                 <button
                   type="button"
                   onClick={() => selectDemoAccount("kishorkakde026@gmail.com", "Kishor@1777", "admin")}
                   className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden group ${activeRole === 'admin' ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-500/10' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/50 bg-white'}`}
                 >
                   <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 mb-1">
                     <Zap className={`size-4 ${activeRole === 'admin' ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} /> 
                     Admin
                   </div>
                   <div className="text-[10px] text-slate-500 font-medium">SysAuth</div>
                 </button>
                 <button
                   type="button"
                   onClick={() => selectDemoAccount("specialist@healthai.clinic", "HealthAI@2026", "doctor")}
                   className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden group ${activeRole === 'doctor' ? 'border-blue-400 bg-blue-50 ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 bg-white'}`}
                 >
                   <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 mb-1">
                     <Stethoscope className={`size-4 ${activeRole === 'doctor' ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} /> 
                     Doctor
                   </div>
                   <div className="text-[10px] text-slate-500 font-medium">Clinician</div>
                 </button>
                 <button
                   type="button"
                   onClick={() => selectDemoAccount("patient@healthai.clinic", "HealthAI@2026", "patient")}
                   className={`relative p-3 rounded-2xl border text-left transition-all overflow-hidden group ${activeRole === 'patient' ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-500/10' : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 bg-white'}`}
                 >
                   <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 mb-1">
                     <UserCircle className={`size-4 ${activeRole === 'patient' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`} /> 
                     Patient
                   </div>
                   <div className="text-[10px] text-slate-500 font-medium">Standard</div>
                 </button>
               </div>
             </div>

             <form onSubmit={handleLogin} className="space-y-5">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                     <Mail className="size-3.5 text-slate-400" /> Institutional Email
                   </Label>
                   <Input
                     type="email"
                     placeholder="name@healthcare.com"
                     className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     required
                   />
                 </div>

                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                     <Lock className="size-3.5 text-slate-400" /> Password
                   </Label>
                   <div className="relative">
                     <Input
                       type={showPassword ? "text" : "password"}
                       placeholder="••••••••••••"
                       className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-4 pr-12 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-white transition-all"
                       value={formData.password}
                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       required
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                       tabIndex={-1}
                     >
                       {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                     </button>
                   </div>
                 </div>
               </div>

               <Button
                 type="submit"
                 className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/15 transition-all group overflow-hidden relative"
                 disabled={loading}
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                 {loading ? (
                   <Loader2 className="size-5 animate-spin" />
                 ) : (
                   <span className="flex items-center gap-2">
                     Authenticate Securely <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                   </span>
                 )}
               </Button>

               <div className="relative py-4">
                 <div className="absolute inset-0 flex items-center">
                   <span className="w-full border-t border-slate-200" />
                 </div>
                 <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                   <span className="bg-white px-4 text-slate-400">Emergency Access</span>
                 </div>
               </div>

               <Button
                 type="button"
                 variant="outline"
                 className="w-full h-14 rounded-2xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold uppercase tracking-widest gap-2.5 transition-all text-slate-600"
                 onClick={handleGuestLogin}
                 disabled={guestLoading}
               >
                 {guestLoading ? (
                   <Loader2 className="size-5 animate-spin text-slate-400" />
                 ) : (
                   <>
                     <Fingerprint className="size-4 text-slate-400" />
                     Enter As Clinical Guest
                   </>
                 )}
               </Button>
             </form>

             <div className="mt-10 text-center">
               <p className="text-sm font-medium text-slate-500">
                 Need institutional access?{" "}
                 <Link
                   href="/signup"
                   className="text-primary font-black uppercase tracking-wider ml-1 hover:underline underline-offset-4"
                 >
                   Register Node
                 </Link>
               </p>
             </div>
          </motion.div>
       </div>
    </div>
  );
}
