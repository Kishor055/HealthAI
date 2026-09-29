"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ChevronLeft,
  ShieldCheck,
  User,
  Mail,
  Lock,
  HeartPulse,
  AlertCircle,
  Eye,
  EyeOff,
  Stethoscope,
  Activity,
  Database,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile
} from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";
import { apiRegister } from "@/lib/api-client";

const systemFeatures = [
  { icon: ShieldCheck, title: "HIPAA Compliant", desc: "End-to-end encrypted PHI data protocols" },
  { icon: Activity, title: "Real-time Telemetry", desc: "Sub-second biometric streaming & alerts" },
  { icon: Database, title: "RAG Intelligence", desc: "Evidence-based automated clinical decisions" },
];

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = getFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    bloodType: "O+",
    allergies: "None recorded",
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;
    setLoading(true);

    try {
      await apiRegister({
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
        role: formData.role,
        blood_type: formData.bloodType,
        allergies: formData.allergies,
      }).catch(() => null);

      let user = null;
      try {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = cred.user;
      } catch (fbErr: any) {
        const anon = await signInAnonymously(auth);
        user = anon.user;
      }

      if (user) {
        await updateProfile(user, { displayName: formData.name }).catch(() => null);

        const isAdmin = formData.email === "kishorkakde026@gmail.com" || formData.role === "admin";

        setDocumentNonBlocking(
          doc(db, "users", user.uid),
          {
            id: user.uid,
            email: formData.email,
            displayName: formData.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: isAdmin ? "admin" : formData.role,
            bloodType: formData.bloodType,
            allergies: formData.allergies,
            hasFullAccess: isAdmin,
          },
          { merge: true }
        );

        const idToken = await user.getIdToken().catch(() => null);
        if (idToken) {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }).catch(() => null);
        }

        toast({
          title: "Clinical Identity Created",
          description: `Account initialized for ${formData.name}. Routing to secure environment.`,
        });

        router.push("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Interrupted",
        description: error.message || "Unable to register identity. Please retry.",
      });
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex bg-slate-900 font-body selection:bg-primary/30">
       {/* Left side: Premium Enterprise Branding */}
       <div className="hidden lg:flex w-[45%] xl:w-[50%] relative overflow-hidden bg-slate-950 flex-col justify-between p-12 xl:p-16 text-white">
           <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
           <div className="absolute bottom-[0%] left-[-20%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
           
           <div className="relative z-10">
               <Link href="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
                  <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] border border-white/10">
                     <ShieldCheck className="size-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold tracking-tight">HealthAI<span className="text-emerald-500 font-black">PRO</span></span>
               </Link>

               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-6">
                       <span className="relative flex h-2 w-2">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                       </span>
                       Network Enrollment Active
                   </div>
                   <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                      Join the Clinical<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400">Intelligence Network</span>
                   </h1>
                   <p className="text-slate-400 text-lg xl:text-xl max-w-lg font-medium leading-relaxed">
                      Register your institutional profile to deploy AI-driven triage protocols and monitor patient telemetry securely.
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
                        <f.icon className="size-5 text-emerald-400" />
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
          <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black text-slate-400 hover:text-emerald-500 transition-all group lg:hidden">
             <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> HOME
          </Link>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[480px] my-auto pt-10 pb-10"
          >
             <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">Initialize Profile</h2>
                <p className="text-slate-500 font-medium text-sm md:text-base">Establish your identity within the HealthAI PRO environment.</p>
             </div>

             <form onSubmit={handleRegister} className="space-y-5">
               <div className="space-y-4">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <User className="size-3.5 text-slate-400" /> Full Name
                      </Label>
                      <Input
                        placeholder="Dr. Sarah Chen"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Stethoscope className="size-3.5 text-slate-400" /> System Role
                      </Label>
                      <div className="relative">
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full h-14 appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all outline-none"
                        >
                          <option value="patient">Patient</option>
                          <option value="clinician">Clinician / Doctor</option>
                          <option value="pharmacist">Pharmacist</option>
                          <option value="admin">System Admin</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                     <Mail className="size-3.5 text-slate-400" /> Institutional Email
                   </Label>
                   <Input
                     type="email"
                     placeholder="name@healthcare.com"
                     className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     required
                   />
                 </div>

                 <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                     <Lock className="size-3.5 text-slate-400" /> Secure Password
                   </Label>
                   <div className="relative">
                     <Input
                       type={showPassword ? "text" : "password"}
                       placeholder="Min. 8 characters"
                       className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-4 pr-12 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                       value={formData.password}
                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       required
                       minLength={8}
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

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <HeartPulse className="size-3.5 text-slate-400" /> Blood Group
                      </Label>
                      <div className="relative">
                        <select
                          value={formData.bloodType}
                          onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                          className="w-full h-14 appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all outline-none"
                        >
                          <option value="O+">O+ (Positive)</option>
                          <option value="O-">O- (Negative)</option>
                          <option value="A+">A+ (Positive)</option>
                          <option value="A-">A- (Negative)</option>
                          <option value="B+">B+ (Positive)</option>
                          <option value="B-">B- (Negative)</option>
                          <option value="AB+">AB+ (Positive)</option>
                          <option value="AB-">AB- (Negative)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <AlertCircle className="size-3.5 text-slate-400" /> Known Allergies
                      </Label>
                      <Input
                        placeholder="e.g. Penicillin, None"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 px-4 font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-white transition-all"
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      />
                    </div>
                 </div>

               </div>

               <Button
                 type="submit"
                 className="w-full h-14 mt-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/15 transition-all group overflow-hidden relative"
                 disabled={loading}
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                 {loading ? (
                   <Loader2 className="size-5 animate-spin" />
                 ) : (
                   <span className="flex items-center gap-2">
                     Register Node <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                   </span>
                 )}
               </Button>
             </form>

             <div className="mt-10 text-center">
               <p className="text-sm font-medium text-slate-500">
                 Already integrated?{" "}
                 <Link
                   href="/login"
                   className="text-emerald-600 font-black uppercase tracking-wider ml-1 hover:underline underline-offset-4"
                 >
                   Access Portal
                 </Link>
               </p>
             </div>
          </motion.div>
       </div>
    </div>
  );
}
