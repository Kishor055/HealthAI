
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, User, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import { signInAnonymously, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";

/**
 * Simplified Signup Page for HealthAI.
 * Removed dual OTP requirements for rapid clinical onboarding.
 */
export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = getFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: ""
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSimpleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setLoading(true);

    try {
      // Use Anonymous Sign-in as the engine for direct prototype access
      const result = await signInAnonymously(auth);
      const user = result.user;

      if (user) {
        await updateProfile(user, { displayName: formData.name });
        
        // Setup initial user profile in Firestore
        setDocumentNonBlocking(doc(db, 'users', user.uid), {
          id: user.uid,
          email: formData.email,
          phone: formData.phone,
          displayName: formData.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'user',
          bloodType: 'O+',
          allergies: 'None recorded'
        }, { merge: true });

        const idToken = await user.getIdToken();
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        toast({ title: "Registration Complete", description: "Clinical profile created successfully." });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    } finally {
      setLoading(false);
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
        bloodType: 'O+',
        allergies: 'None recorded'
      }, { merge: true });

      const idToken = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-Up Failed", description: error.message });
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
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck className="size-6 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-2">Create Account</h1>
              <p className="text-sm font-medium text-slate-400">Immediate access to HealthAI tools</p>
            </div>

            <form onSubmit={handleSimpleRegister} className="space-y-6">
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
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number (Optional)</Label>
                  <Input 
                    placeholder="+91 98765 43210"
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-primary px-6"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 mt-2 shadow-xl shadow-primary/20">
                {loading ? <Loader2 className="animate-spin" /> : "Complete Registration"}
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
                Continue with Google
              </Button>
            </form>

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
