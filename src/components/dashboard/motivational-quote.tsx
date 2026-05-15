"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Quote, RefreshCw, Trophy, HeartPulse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quotes = [
  "Your health is an investment, not an expense.",
  "Every small step towards health is a giant leap for your future.",
  "Take care of your body. It's the only place you have to live.",
  "The greatest wealth is health.",
  "A journey of a thousand miles begins with a single dose of self-care.",
  "Your health is your most precious asset. Protect it with consistency.",
  "Self-care is not selfish. It's essential for your well-being.",
  "Be patient with yourself. Health is a long-term commitment.",
  "Success in health starts with the decision to try.",
  "Healthy habits are the foundation of a long and vibrant life.",
  "Small changes today lead to a healthier tomorrow.",
  "Listen to your body, it's the smartest tool you own."
];

export function MotivationalQuote() {
  const [quote, setQuote] = useState("");
  const [key, setKey] = useState(0);

  const refreshQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    refreshQuote();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-2xl shadow-primary/5 group relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <HeartPulse className="size-32 -rotate-12" />
        </div>
        
        <CardContent className="p-8 relative z-10">
          <Quote className="absolute -top-4 -left-4 size-20 text-primary/5 -rotate-12 transition-transform group-hover:rotate-0 duration-500" />
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="p-3 rounded-2xl bg-white shadow-xl shadow-primary/5 border border-primary/5"
                >
                  <Trophy className="size-6 text-primary" />
                </motion.div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 leading-none">Insight Portal</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="size-1.5 bg-accent rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">Active Recovery</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-10 rounded-2xl hover:bg-primary/10 text-primary/40 hover:text-primary transition-all bg-white/50 backdrop-blur-sm shadow-sm"
                onClick={refreshQuote}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 1.05, x: 10 }}
                className="space-y-4"
              >
                <p className="text-xl font-medium leading-relaxed italic text-foreground/80 font-headline">
                  "{quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-1 w-12 bg-primary rounded-full shadow-lg shadow-primary/20" />
                  <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">Consistency is Power</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
