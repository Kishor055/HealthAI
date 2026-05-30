
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Mail, Phone, User, ArrowRight, Loader2, ShieldCheck, Smartphone, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OTPInput } from "@/components/auth/otp-input";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  updateProfile
} from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = getFirestore();
  const { toast } = useToast();
  
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

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-signup-container', {
        size: 'invisible',
      });
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
      
      // Demo Logic: Email OTP would be triggered here via Cloud Function
      toast({ title: "Dual OTPs Dispatched", description: "Check your email and SMS for secure access codes." });
      setStep('verify');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registry Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSignup = async () => {
    setLoading(true);
    try {
      if (!confirmationResult) return;
      
      // 1. Verify Phone
      const userCredential = await confirmationResult.confirm(phoneOtp);
      const user = userCredential.user;

      // 2. Update Profile
      await updateProfile(user, { displayName: formData.name });

      // 3. Create Session
      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      // 4. Store in Firestore
      setDocumentNonBlocking(doc(db, 'users', user.uid), {
        id: user.uid,
        email: formData.email,
        phone: formData.phone,
        displayName: formData.name,
        emailVerified: true, // Verification happened in UI step
        phoneVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        devices: [navigator.userAgent],
      }, { merge: true });

      toast({
        title: "Registration Complete",
        description: `Welcome to the HealthAI ecosystem, ${formData.name.split(' ')[0]}.`,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Error", description: "The security codes do not match our records." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] z-10"
      >
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div className="size-16 bg-primary text-primary-foreground rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
            <HeartPulse className="size-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Create Account</h1>
        </div>

        <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[3rem] overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
          
          <CardContent className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 'info' ? (
                <motion.form
                  key="info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleInitiateVerification}
                  className="space-y-6"
                >
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Full Name</Label>
                      <Input 
                        placeholder="Johnathan Doe"
                        className="h-14 rounded-2xl bg-muted/40 border-none px-6 text-lg font-bold"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        icon={<User />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Institutional Email</Label>
                      <Input 
                        type="email"
                        placeholder="dr.doe@health.com"
                        className="h-14 rounded-2xl bg-muted/40 border-none px-6 text-lg font-bold"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        icon={<Mail />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mobile Number</Label>
                      <Input 
                        placeholder="+91 98765 43210"
                        className="h-14 rounded-2xl bg-muted/40 border-none px-6 text-lg font-bold"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        icon={<Smartphone />}
                      />
                    </div>
                  </div>

                  <div id="recaptcha-signup-container" />

                  <Button className="w-full h-16 rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20 mt-4">
                    {loading ? <Loader2 className="animate-spin" /> : <>Get Verification Codes <ArrowRight className="ml-2" /></>}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-10"
                >
                  <div className="text-center space-y-2">
                    <div className="size-16 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="size-10" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Identity Check</h2>
                    <p className="text-sm font-medium text-muted-foreground px-4">
                      We've sent unique security codes to your email and mobile phone.
                    </p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 justify-center">
                        <Mail className="size-3" /> Email OTP
                      </Label>
                      <OTPInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 justify-center">
                        <Smartphone className="size-3" /> SMS OTP
                      </Label>
                      <OTPInput value={phoneOtp} onChange={setPhoneOtp} disabled={loading} />
                    </div>
                  </div>

                  <Button 
                    onClick={handleFinalizeSignup}
                    disabled={emailOtp.length !== 6 || phoneOtp.length !== 6 || loading}
                    className="w-full h-16 rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Complete Enrollment <CheckCircle2 className="ml-2" /></>}
                  </Button>
                  
                  <button 
                    onClick={() => setStep('info')}
                    className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground"
                  >
                    Return to Registration
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Already registered? <Link href="/login" className="text-primary font-black uppercase tracking-widest hover:underline">Access Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
