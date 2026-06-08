
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck, Mail, Phone, Clock, Laptop, Tablet, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OTPInput } from "@/components/auth/otp-input";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import { cn } from "@/lib/utils";
import { dispatchOTP } from "@/ai/flows/dispatch-otp-flow";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getFirestore, serverTimestamp } from "firebase/firestore";

/**
 * SaaS-Grade Minimalist Login Page.
 * Implements Enterprise security auditing for history, devices, and sessions.
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = getFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [method, setMethod] = React.useState<'email' | 'phone'>('email');
  const [step, setStep] = React.useState<'input' | 'verify'>('input');
  const [loading, setLoading] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logSecurityEvent = async (userId: string, eventType: 'login' | 'signup') => {
    const userAgent = navigator.userAgent;
    const deviceType = /Mobile|Android|iPhone/i.test(userAgent) ? 'smartphone' : /Tablet|iPad/i.test(userAgent) ? 'tablet' : 'desktop';
    
    // Log login history
    const historyRef = doc(collection(db, 'users', userId, 'login_history'));
    setDocumentNonBlocking(historyRef, {
      userId,
      timestamp: serverTimestamp(),
      type: eventType,
      device: deviceType,
      userAgent,
      status: 'success'
    });

    // Log active device
    const deviceRef = doc(db, 'users', userId, 'devices', deviceType);
    setDocumentNonBlocking(deviceRef, {
      userId,
      type: deviceType,
      lastLogin: serverTimestamp(),
      userAgent,
      isRevoked: false
    });
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await logSecurityEvent(user.uid, 'login');

      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const cleanIdentifier = identifier.trim();
      
      if (method === 'phone') {
        if (!(window as any).recaptchaVerifier) {
           (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        const verifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, cleanIdentifier, verifier);
        setConfirmationResult(result);
        await dispatchOTP({ identifier: cleanIdentifier, type: 'phone', otp: generatedOtp });
      } else {
        await dispatchOTP({ identifier: cleanIdentifier, type: 'email', otp: generatedOtp });
        toast({ title: "Secure Code Sent", description: "Identity verification initiated via institutional email." });
      }
      setStep('verify');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Request Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      if (method === 'phone' && confirmationResult) {
        await confirmationResult.confirm(otp);
      }
      
      const user = auth.currentUser;
      if (user) {
        await logSecurityEvent(user.uid, 'login');
        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: "The provided code is invalid or has expired." });
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
              <p className="text-lg font-medium text-slate-400">Access your clinical HealthAI profile</p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'input' ? (
                <motion.div key="input" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                  <div className="flex bg-slate-100/50 p-2 rounded-2xl">
                    <button onClick={() => setMethod('email')} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", method === 'email' ? "bg-white shadow-xl text-primary" : "text-slate-500 hover:text-slate-900")}>Institutional Email</button>
                    <button onClick={() => setMethod('phone')} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", method === 'phone' ? "bg-white shadow-xl text-primary" : "text-slate-500 hover:text-slate-900")}>Mobile Access</button>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Verification Identity</Label>
                      <Input
                        placeholder={method === 'email' ? "clinical.id@health.com" : "+91 99999 99999"}
                        className="h-16 rounded-2xl border-slate-100 bg-slate-50/30 focus:border-primary focus:ring-primary/5 px-8 text-lg font-bold"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                    </div>
                    <div id="recaptcha-container" />
                    <Button className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all">
                      {loading ? <Loader2 className="animate-spin" /> : "Verify Identity"}
                    </Button>
                  </form>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-8 text-[10px] font-black uppercase tracking-widest text-slate-300">or</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <Button variant="outline" className="w-full h-16 rounded-2xl border-slate-100 bg-white font-black text-[11px] uppercase tracking-widest text-slate-700 gap-4 hover:bg-slate-50 transition-all" onClick={handleGoogleSignIn} disabled={loading}>
                    <svg className="size-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
                    Google Authentication
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-12 text-center">
                  <div className="space-y-3">
                    <h2 className="text-4xl font-black tracking-tighter">Enter Code</h2>
                    <p className="text-lg font-medium text-slate-400">Security code dispatched to <br/> <span className="text-slate-900 font-black">{identifier}</span></p>
                  </div>
                  <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                  <div className="space-y-6">
                    <Button onClick={handleVerifyOTP} disabled={otp.length !== 6 || loading} className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] bg-primary">
                      {loading ? <Loader2 className="animate-spin" /> : "Authorize & Sign In"}
                    </Button>
                    <button onClick={() => setStep('input')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"><Clock className="size-3" /> Change {method} Identity</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
