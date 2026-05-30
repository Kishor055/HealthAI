
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowRight, Loader2, ShieldCheck, Smartphone, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OTPInput } from "@/components/auth/otp-input";
import { useAuth } from "@/firebase";
import { cn } from "@/lib/utils";
import { dispatchOTP } from "@/ai/flows/dispatch-otp-flow";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [method, setMethod] = React.useState<'email' | 'phone'>('email');
  const [step, setStep] = React.useState<'input' | 'verify'>('input');
  const [loading, setLoading] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const setupRecaptcha = () => {
    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
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
        body: JSON.stringify({ idToken }),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      if (method === 'phone') {
        setupRecaptcha();
        const verifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, identifier, verifier);
        setConfirmationResult(result);
        await dispatchOTP({ identifier, type: 'phone', otp: generatedOtp });
        setStep('verify');
      } else {
        await dispatchOTP({ identifier, type: 'email', otp: generatedOtp });
        toast({ title: "Verification Code Sent", description: "Please check your inbox." });
        setStep('verify');
      }
      setTimer(60);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
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
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        await fetch('/api/auth/session', {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid Code", description: "The verification code is incorrect." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 font-body">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px]"
      >
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Log in</h1>
              <p className="text-sm text-muted-foreground">Sign in to your clinical profile</p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'input' ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setMethod('email')}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                        method === 'email' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setMethod('phone')}
                      className={cn(
                        "flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                        method === 'phone' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      Phone
                    </button>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        {method === 'email' ? 'Email Address' : 'Phone Number'}
                      </Label>
                      <Input
                        placeholder={method === 'email' ? "user@example.com" : "+91 99999 99999"}
                        className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/10 px-4"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                      />
                    </div>

                    <div id="recaptcha-container" />

                    <Button className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                    </Button>
                  </form>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-xs font-medium text-slate-400">or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-slate-200 font-semibold text-slate-700 gap-3"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8 text-center"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Verify Code</h2>
                    <p className="text-sm text-slate-500">
                      Code sent to <span className="text-slate-900 font-semibold">{identifier}</span>
                    </p>
                  </div>

                  <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                  <div className="space-y-4">
                    <Button 
                      onClick={handleVerifyOTP}
                      disabled={otp.length !== 6 || loading}
                      className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest bg-primary"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Verify & Log In"}
                    </Button>
                    <button 
                      onClick={() => setStep('input')}
                      className="text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-primary transition-colors"
                    >
                      Change {method}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-500">
                Already have an account? <Link href="/login" className="text-primary font-bold">Log In</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
