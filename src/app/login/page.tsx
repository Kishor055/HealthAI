"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { signInAnonymously } from "firebase/auth";

/**
 * Simplified Login Page for HealthAI.
 * Streamlined for direct prototype entry.
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
      const result = await signInAnonymously(auth);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      toast({ title: "Access Granted", description: "Identity verified. Opening clinical portal." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Failed", description: error.message });
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
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Institutional Email</Label>
                  <Input
                    type="email"
                    placeholder="dr.doe@health.com"
                    className="h-16 rounded-2xl border-slate-100 bg-slate-50/30 focus:border-primary px-8 text-lg font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : "Access Dashboard"}
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <ShieldCheck className="size-5 text-emerald-500" />
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-tight">
                  Secure single-click access enabled for prototype testing.
                </p>
              </div>
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
