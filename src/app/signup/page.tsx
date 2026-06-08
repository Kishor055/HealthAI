
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, ChevronLeft, User, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OTPInput } from "@/components/auth/otp-input";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import { dispatchOTP } from "@/ai/flows/dispatch-otp-flow";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = getFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [step, setStep] = React.useState<'info' | 'verify'>('info');
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: ""
  });
  
  const [emailOtp, setEmailOtp] = React.useState("");
  const [phoneOtp, setPhoneOtp] = React.useState("");
  const [confirmationResult, setConfirmationResult] = React.useState<ConfirmationResult | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const setupRecaptcha = () => {
    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-signup-container', {
        size: 'invisible',
      });
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setDocumentNonBlocking(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
      }, { merge: true });

      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-Up Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formData.phone, verifier);
      setConfirmationResult(result);
      
      const eOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await dispatchOTP({ identifier: formData.email, type: 'email', otp: eOtp });
      
      toast({ title: "Dual OTPs Dispatched", description: "Verification codes sent to your email and phone." });
      setStep('verify');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Enrollment Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSignup = async () => {
    setLoading(true);
    try {
      if (!confirmationResult) return;
      
      await confirmationResult.confirm(phoneOtp);
      const user = auth.currentUser;
      if (!user) throw new Error("Verification failed.");

      await updateProfile(user, { displayName: formData.name });
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      setDocumentNonBlocking(doc(db, 'users', user.uid), {
        id: user.uid,
        email: formData.email,
        phone: formData.phone,
        displayName: formData.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
      }, { merge: true });

      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid Codes", description: "Please double check your verification codes." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 font-body">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors group">
         <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px]"
      >
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">Create Account</h1>
              <p className="text-sm font-medium text-slate-400">Join the clinical HealthAI platform</p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'info' ? (
                <motion.form
                  key="info"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleInitiateVerification}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                      <Input 
                        placeholder="Johnathan Doe"
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-primary px-6"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</Label>
                      <Input 
                        type="email"
                        placeholder="dr.doe@health.com"
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-primary px-6"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</Label>
                      <Input 
                        placeholder="+91 98765 43210"
                        className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-primary px-6"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div id="recaptcha-signup-container" />

                  <Button className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 mt-2 shadow-xl shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin" /> : "Initiate Verification"}
                  </Button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-4 text-xs font-medium text-slate-300 uppercase">or</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                  </div>

                  <Button 
                    variant="outline" 
                    type="button"
                    className="w-full h-14 rounded-2xl border-slate-100 bg-white font-bold text-slate-700 gap-3"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                  >
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black tracking-tighter">Dual Verification</h2>
                    <p className="text-sm font-medium text-slate-500">Enter codes from Email & SMS</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-primary uppercase tracking-widest text-center block">Secure Email OTP</Label>
                      <OTPInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-primary uppercase tracking-widest text-center block">Secure SMS OTP</Label>
                      <OTPInput value={phoneOtp} onChange={setPhoneOtp} disabled={loading} />
                    </div>
                  </div>

                  <Button 
                    onClick={handleFinalizeSignup}
                    disabled={emailOtp.length !== 6 || phoneOtp.length !== 6 || loading}
                    className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Finalize Clinical Registry"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-400">
                Already have an account? <Link href="/login" className="text-primary font-black uppercase tracking-widest hover:underline transition-all">Log in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
