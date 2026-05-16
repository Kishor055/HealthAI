"use client";

import { motion } from 'framer-motion';
import { Bot, Sparkles, ShieldCheck, Zap, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/placeholder-images';

/**
 * Updated Landing Page with an "Instant Access" entrance.
 * Provides a high-priority login alternative for immediate clinical exploration.
 */
export default function LandingPage() {
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
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-primary size-8" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Clinical Shield v3.0</span>
            </div>
            <blockquote className="space-y-6">
              <p className="text-3xl font-light italic leading-tight">"Health is not just a status, it's a journey. We're here to guide every step with AI-driven intelligence."</p>
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
          
          <div className="bg-card p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Access Protocol Active</h2>
              <p className="text-sm text-muted-foreground font-medium">Explore the clinical ecosystem instantly.</p>
            </div>

            <div className="space-y-4">
              <Link href="/dashboard" className="block w-full">
                <Button className="w-full h-16 text-xl font-black shadow-lg shadow-primary/20 rounded-2xl group transition-all hover:scale-105">
                  Enter Portal <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link href="/dashboard" className="block w-full">
                <Button variant="outline" className="w-full h-14 text-sm font-black rounded-2xl border-2 border-primary/20 text-primary hover:bg-primary/5">
                  <UserCheck className="mr-2 size-4" /> Enter as Guest
                </Button>
              </Link>
            </div>

            <div className="p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20 flex items-center gap-3">
              <Zap className="text-primary size-5 fill-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-tight">
                PROTOTYPE MODE: Auth requirements bypassed for Kishor Patil profile.
              </p>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
            Enterprise Medical Adherence System
          </p>
        </motion.div>
      </div>
    </div>
  );
}
