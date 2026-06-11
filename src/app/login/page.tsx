
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck, Mail, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc } from "firebase/firestore";

/**
 * Enhanced Login Page with Admin Detection.
 * Credentials: kishorkakde026@gmail.com / Kishor@1777
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setLoading(true);

    // Specific Admin Check
    const isAdmin = formData.email === "kishorkakde026@gmail.com" && formData.password === "Kishor@1777";

    try {
      const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // If Admin, ensure role is synced in Firestore
      if (isAdmin) {
        setDocumentNonBlocking(doc(firestore, "users", user.uid), {
          role: 'admin',
          lastAdminLogin: new Date().toISOString(),
          hasFullAccess: true
        }, { merge: true });
      }

      // Sync session with Next.js middleware
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      toast({ 
        title: isAdmin ? "Admin Access Granted" : "Access Granted", 
        description: isAdmin ? "System Administrator verified. Full access active." : "Identity verified. Opening clinical portal." 
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Invalid credentials." });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      toast({ title: "Success", description: "Logged in with Google." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Access Failed", description: error.message });
      setGoogleLoading(false);
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
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Clinical Authentication</p>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Security Password</Label>
                    <button type="button" className="text-[9px] font-black text-primary uppercase hover:underline">Forgot?</button>
                  </div>
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

              <Button className="w-full h-14 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Access Portal"}
              </Button>

              {formData.email === "kishorkakde026@gmail.com" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                   <Zap className="size-4 text-amber-600 animate-pulse" />
                   <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Admin Credentials Detected</p>
                </div>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-white px-4 text-slate-400">OR</span></div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-14 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest gap-3"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <svg className="size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                    Institutional Google Sign-In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-400">
                Need an account? <Link href="/signup" className="text-primary font-black uppercase tracking-widest ml-2 hover:underline">Register</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
