
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

  useEffect(() => {
    // Select a random quote on mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-xl shadow-primary/5">
        <CardContent className="p-6 relative">
          <Quote className="absolute -top-2 -left-2 size-12 text-primary/10 -rotate-12" />
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white shadow-inner">
              <Sparkles className="size-6 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Daily Inspiration</h4>
              <p className="text-lg font-medium leading-relaxed italic text-foreground/80">
                "{quote}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
