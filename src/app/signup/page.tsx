
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck, User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, setDocumentNonBlocking } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getFirestore } from "firebase/firestore";

/**
 * Proper Signup Page.
 * Secure account creation for clinical users.
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
    password: "",
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
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

        toast({ title: "Account Secured", description: "Clinical profile established. Opening dashboard." });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[450px]"
      >
        <Card className="border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-10 md:p-12">
            <div className="text-center mb-10">
              <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <ShieldCheck className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 leading-none">Register</h1>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">New Clinical Identity</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</Label>
                  <Input 
                    placeholder="e.g. Dr. John Doe"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/50 px-6 font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
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
                    placeholder="Min. 8 characters"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/50 px-6 font-bold"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>

              <Button className="w-full h-16 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all mt-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Create Secure Account"}
              </Button>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <User className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  Your credentials will be encrypted and used to generate a unique Clinical ID for medication safety auditing.
                </p>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-400">
                Already have an account? <Link href="/login" className="text-primary font-black uppercase tracking-widest ml-2 hover:underline">Login</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
