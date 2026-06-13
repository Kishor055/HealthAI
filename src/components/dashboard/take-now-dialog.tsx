"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pill, Check, Loader2, AlertCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { query, collection, where, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface TakeNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TakeNowDialog({ open, onOpenChange }: TakeNowDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const activeMedsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "medicines"),
      where("isActive", "==", true)
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
      title: "Dose Logged",
      description: `You have successfully recorded your intake of ${med.name}.`,
    });
    setProcessingId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Take Medication Now</DialogTitle>
          <DialogDescription>
            Select a medication to log an unscheduled or immediate dose.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !medications || medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
              <AlertCircle className="h-10 w-10 opacity-20" />
              <p>No active medications found.</p>
            </div>
          ) : (
            medications.map((med) => (
              <div 
                key={med.id} 
                className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => handleTakeMedication(med)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" disabled={processingId === med.id}>
                  {processingId === med.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
