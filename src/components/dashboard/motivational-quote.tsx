
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Quote, RefreshCw } from "lucide-react";
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
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-2xl shadow-primary/5 group">
        <CardContent className="p-8 relative">
          <Quote className="absolute -top-4 -left-4 size-20 text-primary/5 -rotate-12 transition-transform group-hover:rotate-0 duration-500" />
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white shadow-xl shadow-primary/5">
                  <Sparkles className="size-6 text-primary animate-pulse" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Insight Portal</h4>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 rounded-full hover:bg-primary/10 text-primary/40 hover:text-primary transition-all"
                onClick={refreshQuote}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.p 
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-xl font-medium leading-relaxed italic text-foreground/80 font-headline"
              >
                "{quote}"
              </motion.p>
            </AnimatePresence>
            
            <div className="h-1 w-12 bg-primary/20 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
