"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, SkipForward, Clock, Loader2, PartyPopper, Timer } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { query, collection, where, limit, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function Reminders() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeMedsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "medicines"),
      where("isActive", "==", true),
      limit(4)
    );
  }, [firestore, user?.uid]);

  const { data: medications, isLoading } = useCollection(activeMedsQuery);

  const handleTakeMedication = (med: any) => {
    if (!user || !firestore) return;
    setProcessingId(med.id);
    
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "medicationIntakes"), {
      userId: user.uid,
      medicineId: med.id,
      medicineName: med.name,
      scheduledTime: new Date().toISOString(),
      actualTakeTime: new Date().toISOString(),
      status: "taken",
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Excellent Adherence!",
      description: `Success! You've logged ${med.name}. Consistency is key.`,
      action: <PartyPopper className="size-5 text-accent animate-bounce" />,
    });
    
    setTimeout(() => setProcessingId(null), 800);
  };

  const getCountdown = () => {
    const mins = 59 - currentTime.getMinutes();
    const secs = 59 - currentTime.getSeconds();
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Schedule</CardTitle>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
            <Timer className="size-3" />
            Next Sync: {getCountdown()}
          </div>
        </div>
        <CardDescription>
          Real-time tracking of your active medication plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
              </div>
            ) : medications?.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground font-medium italic">
                Your schedule is clear. Add medications to begin tracking.
              </div>
            ) : (
              medications?.map((med, index) => (
                <motion.div 
                  key={med.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-3xl bg-background/50 hover:bg-white border border-transparent hover:border-primary/20 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-2xl size-12 shrink-0 group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-black text-sm truncate uppercase tracking-tighter text-foreground">{med.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-black uppercase tracking-[0.15em] opacity-50">
                      {med.dosage} • DUE NOW
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 rounded-xl hover:bg-destructive/5 hover:text-destructive"
                      disabled={processingId === med.id}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="h-10 bg-accent hover:bg-accent/90 text-accent-foreground font-black px-5 rounded-xl shadow-lg shadow-accent/20"
                      onClick={() => handleTakeMedication(med)}
                      disabled={processingId === med.id}
                    >
                      {processingId === med.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Log
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
