"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";

/**
 * Simplified Signup Page for HealthAI.
 * Email-only registration protocol for rapid clinical deployment.
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
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSimpleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setLoading(true);

    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      if (user) {
        await updateProfile(user, { displayName: formData.name });
        
        // Setup initial user profile in Firestore
        setDocumentNonBlocking(doc(db, 'users', user.uid), {
          id: user.uid,
          email: formData.email,
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

        toast({ title: "Registration Complete", description: "Clinical profile created. Accessing portal." });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-white font-body">
      <Link href="/" className="absolute top-10 left-10 flex items-center gap-3 text-sm font-black text-slate-400 hover:text-primary transition-all group">
         <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" /> BACK
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px]"
      >
        <Card className="border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.04)] rounded-[3rem] overflow-hidden bg-white">
          <CardContent className="p-12 md:p-16">
            <div className="text-center mb-12">
              <div className="size-16 bg-primary/10 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6">
                 <ShieldCheck className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-3 leading-none">Register</h1>
              <p className="text-lg font-medium text-slate-400">Join the AI-managed clinical network</p>
            </div>

            <form onSubmit={handleSimpleRegister} className="space-y-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Full Name</Label>
                  <Input 
                    placeholder="Dr. John Doe"
                    className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-primary px-8 text-lg font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Institutional Email</Label>
                  <Input 
                    type="email"
                    placeholder="name@healthcare.com"
                    className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-primary px-8 text-lg font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <Button className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all mt-4">
                {loading ? <Loader2 className="animate-spin" /> : "Create Access Card"}
              </Button>

              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <User className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Registering provides you with a unique Clinical ID for medication tracking and administrative record management.
                </p>
              </div>
            </form>

            <div className="mt-16 text-center">
              <p className="text-base font-medium text-slate-400">
                Already registered? <Link href="/login" className="text-primary font-black uppercase tracking-widest ml-2 transition-all hover:underline">Log in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
