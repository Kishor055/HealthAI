
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, SkipForward, Clock, Loader2, PartyPopper } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { query, collection, where, limit, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function Reminders() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      title: "Excellent!",
      description: `Success! You've taken your ${med.name}. Your body thanks you!`,
      action: <PartyPopper className="size-5 text-accent animate-bounce" />,
    });
    
    setTimeout(() => setProcessingId(null), 500);
  };

  return (
    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
        <CardDescription>
          Your next scheduled doses based on active medications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : medications?.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground italic">
                No active medications. Your schedule is clear!
              </div>
            ) : (
              medications?.map((med, index) => (
                <motion.div 
                  key={med.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-white/50 border border-transparent hover:border-primary/10 transition-all group"
                >
                  <div className="flex items-center justify-center bg-primary/10 text-primary rounded-2xl size-12 shrink-0 group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-black text-sm truncate uppercase tracking-tight">{med.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-bold uppercase tracking-widest opacity-60">
                      {med.dosage} • {med.frequency}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-10 w-10 p-0 text-muted-foreground rounded-xl"
                      disabled={processingId === med.id}
                      suppressHydrationWarning
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="h-10 bg-accent hover:bg-accent/90 text-accent-foreground font-black px-4 rounded-xl shadow-lg shadow-accent/20"
                      onClick={() => handleTakeMedication(med)}
                      disabled={processingId === med.id}
                      suppressHydrationWarning
                    >
                      {processingId === med.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1.5" />
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
