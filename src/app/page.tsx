"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bot, Loader2, UserCheck, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { placeholderImages } from '@/lib/placeholder-images';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const GoogleIcon = () => (
  <svg className="size-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20c0-1.341-.138-2.65-.389-3.917Z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691Z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.617-3.276-11.283-7.942l-6.522,5.025C9.505,39.556,16.227,44,24,44Z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C44.982,36.308,48,30.638,48,24c0-1.341-.138-2.65-.389-3.917Z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sync Failed",
        description: error.message,
      });
      setIsGoogleLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsGuestLoading(true);
    try {
      initiateAnonymousSignIn(auth);
      toast({
        title: "Guest Session Active",
        description: "Welcome! Explore the dashboard as a guest.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Guest Access Failed",
        description: error.message,
      });
      setIsGuestLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 bg-background overflow-hidden">
      <div className="hidden bg-muted lg:block relative">
        <Image
          src={placeholderImages.find(img => img.id === "login-hero")?.imageUrl || "/placeholder.svg"}
          alt="Healthcare background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent" />
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute bottom-12 left-12 right-12"
        >
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[2rem] border border-white/20 text-white shadow-2xl">
            <blockquote className="space-y-6">
              <p className="text-3xl font-light italic leading-tight">"Health is not just a status, it's a journey. We're here to guide every step."</p>
              <footer className="text-sm font-black uppercase tracking-widest opacity-80">— The HealthAI Core</footer>
            </blockquote>
          </div>
        </motion.div>
      </div>
      <div className="flex items-center justify-center py-12 px-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto grid w-full max-w-[420px] gap-10"
        >
          <div className="grid gap-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-primary text-primary-foreground rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-primary/30">
                <Bot className="h-8 w-8" />
              </div>
              <h1 className="text-5xl font-black font-headline tracking-tighter text-primary">HealthAI</h1>
            </div>
            <p className="text-muted-foreground text-xl font-medium">
              Intelligence in your care.
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border">
            <form onSubmit={handleLogin} className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12 rounded-xl bg-muted/50 border-none px-4"
                  suppressHydrationWarning
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Secure Password</Label>
                  <Link href="#" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                    Recovery
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-12 rounded-xl bg-muted/50 border-none px-4"
                  suppressHydrationWarning
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-black shadow-lg shadow-primary/20 rounded-xl" disabled={isLoading || isGoogleLoading || isGuestLoading} suppressHydrationWarning>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Portal'}
              </Button>
              
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold">
                  <span className="bg-card px-4 text-muted-foreground tracking-[0.2em]">Partner Access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" className="h-12 font-bold rounded-xl border-2" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading || isGuestLoading} suppressHydrationWarning>
                  {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Google</>}
                </Button>
                <Button variant="secondary" type="button" className="h-12 font-bold rounded-xl border-2 border-primary/10" onClick={handleGuestLogin} disabled={isLoading || isGoogleLoading || isGuestLoading} suppressHydrationWarning>
                  {isGuestLoading ? <Loader2 className="animate-spin" /> : <><Shield className="size-4 mr-2" /> Guest</>}
                </Button>
              </div>
            </form>
          </div>
          
          <p className="px-8 text-center text-sm text-muted-foreground font-medium">
            New patient?{' '}
            <Link href="/signup" className="font-black text-primary underline-offset-4 hover:underline">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}