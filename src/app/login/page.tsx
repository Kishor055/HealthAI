
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck, Mail, Lock, Zap, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { doc } from "firebase/firestore";

/**
 * Guest Access Login System Gateway.
 * Supports Admin node detection and frictionless Guest entry.
 * Uses Anonymous Auth to prevent "Email in Use" conflicts during prototyping.
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [guestLoading, setGuestLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const syncSession = async (user: any, email: string, isAdmin: boolean) => {
    // 1. Establish Clinical Profile in Firestore
    const profileRef = doc(firestore, "users", user.uid);
    setDocumentNonBlocking(profileRef, {
      id: user.uid,
      email: email || "guest@healthai.internal",
      role: isAdmin ? 'admin' : 'user',
      lastLogin: new Date().toISOString(),
      hasFullAccess: isAdmin,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Sync session with Next.js middleware via API cookie
    const idToken = await user.getIdToken();
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) throw new Error("Session synchronization failed");
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const result = await signInAnonymously(auth);
      await syncSession(result.user, "guest@healthai.internal", false);

      toast({ 
        title: "Guest Node Active", 
        description: "Standard clinical access synchronized." 
      });
      router.push('/dashboard');
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Access Error", 
        description: "Guest node unavailable. Please retry." 
      });
      setGuestLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setLoading(true);

    const isAdmin = formData.email === "kishorkakde026@gmail.com" && formData.password === "Kishor@1777";

    try {
      const result = await signInAnonymously(auth);
      await syncSession(result.user, formData.email, isAdmin);

      toast({ 
        title: isAdmin ? "Admin Access Granted" : "Access Granted", 
        description: isAdmin ? "System Administrator verified. Full access active." : "Clinical portal synchronized." 
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Interrupted", 
        description: "Unable to synchronize identity. Please retry."
      });
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50/50 font-body">
      <Link href="/" className="absolute top-10 left-10 flex items-center gap-3 text-sm font-black text-slate-400 hover:text-primary transition-all group">
         <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" /> BACK
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px]"
      >
        <Card className="border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-10 md:p-12">
            <div className="text-center mb-10">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 leading-none">Login</h1>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Clinical Identity Portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Institutional Email</Label>
                  <Input
                    type="email"
                    placeholder="name@healthcare.com"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/50 px-6 font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/50 px-6 font-bold"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <Button className="w-full h-14 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Access Node"}
              </Button>

              {formData.email === "kishorkakde026@gmail.com" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                   <Zap className="size-4 text-amber-600 animate-pulse" />
                   <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest text-center flex-1">Admin Mode Detected</p>
                </motion.div>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-white px-4 text-slate-400">OR</span></div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-16 rounded-xl border-2 text-[12px] font-black uppercase tracking-widest gap-3 shadow-lg shadow-primary/5 group"
                onClick={handleGuestLogin}
                disabled={guestLoading}
              >
                {guestLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <UserCircle className="size-6 text-primary group-hover:scale-110 transition-transform" />
                    Enter as Guest
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-400">
                New to HealthAI? <Link href="/signup" className="text-primary font-black uppercase tracking-widest ml-2 hover:underline">Register Identity</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
