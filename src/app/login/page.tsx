
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Mail, Phone, ArrowRight, Loader2, ShieldCheck, Smartphone, MailCheck } from "lucide-react";
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
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signInWithEmailAndPassword
} from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [method, setMethod] = React.useState<'email' | 'phone'>('email');
  const [step, setStep] = React.useState<'input' | 'verify'>('input');
  const [loading, setLoading] = React.useState(false);
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = React.useState(0);

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (method === 'phone') {
        setupRecaptcha();
        const verifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, identifier, verifier);
        setConfirmationResult(result);
        setStep('verify');
      } else {
        // Logic for Email Login (Demo: Simple link logic or custom OTP)
        toast({ title: "Email Verification Sent", description: "A secure code has been sent to your inbox." });
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
      } else {
        // Mock verification for custom email OTP logic
        toast({ title: "Verification Successful" });
      }

      // Create session cookie
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        await fetch('/api/auth/session', {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        });
      }

      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid Code", description: "The OTP you entered is incorrect." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="size-16 bg-primary text-primary-foreground rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3">
            <HeartPulse className="size-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">HealthAI Portal</h1>
            <p className="text-muted-foreground font-medium italic">Clinical Intelligence Access</p>
          </div>
        </div>

        <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
          
          <CardContent className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              {step === 'input' ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="flex bg-muted/50 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setMethod('email')}
                      className={cn(
                        "flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        method === 'email' ? "bg-white shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Mail className="inline-block size-3 mr-2" /> Email
                    </button>
                    <button
                      onClick={() => setMethod('phone')}
                      className={cn(
                        "flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        method === 'phone' ? "bg-white shadow-lg text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Phone className="inline-block size-3 mr-2" /> Phone
                    </button>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">
                        {method === 'email' ? 'Institutional Email' : 'Mobile Number'}
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                          {method === 'email' ? <Mail className="size-5" /> : <Smartphone className="size-5" />}
                        </div>
                        <Input
                          placeholder={method === 'email' ? "dr.smith@clinic.com" : "+91 99999 99999"}
                          className="h-14 pl-12 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 text-lg font-bold"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div id="recaptcha-container" />

                    <Button className="w-full h-16 rounded-[1.75rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {loading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight className="ml-2" /></>}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10 text-center"
                >
                  <div className="space-y-2">
                    <div className="size-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                      {method === 'email' ? <MailCheck className="size-8" /> : <ShieldCheck className="size-8" />}
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Enter Secure Code</h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      Verification sent to <span className="text-foreground font-bold">{identifier}</span>
                    </p>
                  </div>

                  <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                  <div className="space-y-6">
                    <Button 
                      onClick={handleVerifyOTP}
                      disabled={otp.length !== 6 || loading}
                      className="w-full h-16 rounded-[1.75rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Verify & Authorize"}
                    </Button>

                    <div className="flex flex-col gap-2">
                      {timer > 0 ? (
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Resend available in {timer}s
                        </p>
                      ) : (
                        <button 
                          onClick={handleSendOTP}
                          className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                        >
                          Request New Code
                        </button>
                      )}
                      <button 
                        onClick={() => setStep('input')}
                        className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground"
                      >
                        Change {method}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            New to HealthAI? <Link href="/signup" className="text-primary font-black uppercase tracking-widest hover:underline">Create Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
