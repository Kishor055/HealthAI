
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

/**
 * Simplified Login Page for HealthAI.
 * OTP verification removed for immediate prototype access.
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSimpleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use Anonymous Sign-in for simple, instant access while maintaining UID-based data
      const result = await signInAnonymously(auth);
      const user = result.user;

      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      toast({ title: "Welcome back", description: "Identity verified. Redirecting to clinical portal." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 font-body">
      <Link href="/" className="absolute top-10 left-10 flex items-center gap-3 text-sm font-black text-slate-400 hover:text-primary transition-all group">
         <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" /> BACK TO PORTAL
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px]"
      >
        <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white">
          <CardContent className="p-12 md:p-16">
            <div className="text-center mb-12">
              <div className="size-16 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck className="size-8 text-primary" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-3 leading-none">Log in</h1>
              <p className="text-lg font-medium text-slate-400">Direct access to your clinical profile</p>
            </div>

            <form onSubmit={handleSimpleLogin} className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="dr.doe@health.com"
                    className="h-16 rounded-2xl border-slate-100 bg-slate-50/30 focus:border-primary focus:ring-primary/5 px-8 text-lg font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : "Access Dashboard"}
                </Button>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-8 text-[10px] font-black uppercase tracking-widest text-slate-300">or</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <Button 
                type="button"
                variant="outline" 
                className="w-full h-16 rounded-2xl border-slate-100 bg-white font-black text-[11px] uppercase tracking-widest text-slate-700 gap-4 hover:bg-slate-50 transition-all" 
                onClick={handleGoogleSignIn} 
                disabled={loading}
              >
                <svg className="size-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
                Google Authentication
              </Button>
            </form>

            <div className="mt-16 text-center">
              <p className="text-base font-medium text-slate-400">
                New to the platform? <Link href="/signup" className="text-primary font-black uppercase tracking-widest ml-2 transition-all hover:underline">Register Now</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
