
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
import { Check, SkipForward, Clock, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { query, collection, where, limit, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
    
    // Log the intake to Firestore using non-blocking pattern for immediate UI response
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
      title: "Medication Logged",
      description: `You have successfully taken ${med.name}. Keep it up!`,
    });
    setProcessingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
        <CardDescription>
          Your next scheduled doses based on active medications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : medications?.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No active medications. Add some to see reminders.
            </div>
          ) : (
            medications?.map((med) => (
              <div key={med.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border transition-all">
                <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full size-10 shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold truncate">{med.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {med.dosage} • {med.frequency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-muted-foreground"
                    disabled={processingId === med.id}
                    suppressHydrationWarning
                  >
                    <SkipForward className="h-4 w-4" />
                    <span className="sr-only">Skip</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-3"
                    onClick={() => handleTakeMedication(med)}
                    disabled={processingId === med.id}
                    suppressHydrationWarning
                  >
                    {processingId === med.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Take
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
