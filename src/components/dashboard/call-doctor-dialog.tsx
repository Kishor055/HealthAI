
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, User, Loader2, ExternalLink, HeartPulse } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { query, collection } from "firebase/firestore";

interface CallDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDoctorDialog({ open, onOpenChange }: CallDoctorDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const providersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: preferredProviders, isLoading } = useCollection(providersQuery);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="text-primary h-6 w-6" />
            Healthcare Directory
          </DialogTitle>
          <DialogDescription>
            Instantly connect with your primary care team or emergency services.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !preferredProviders || preferredProviders.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-6 bg-muted/30 rounded-2xl border-2 border-dashed border-muted-foreground/20">
                <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No preferred providers saved.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Add providers via the Discover map to see them here.</p>
              </div>
              
              <div className="p-4 bg-destructive/5 rounded-2xl border-2 border-destructive/20 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <HeartPulse className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-tighter">Emergency Protocol</span>
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  If you are experiencing a medical emergency, do not wait. Connect to local services immediately.
                </p>
                <Button variant="destructive" className="w-full font-black h-12 shadow-lg shadow-destructive/20" asChild>
                  <a href="tel:911">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency Services
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {preferredProviders.map((provider) => (
                <div key={provider.id} className="p-4 rounded-xl border-2 bg-card hover:border-primary/50 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-none mb-1">{provider.providerName || "Dr. Professional"}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{provider.providerSpecialty || "General Practitioner"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 font-bold h-9 shadow-sm" asChild>
                      <a href={`tel:${provider.providerPhone || '000-000-0000'}`}>
                        <Phone className="h-3 w-3 mr-2" />
                        Call
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 font-bold h-9" asChild>
                      <a href={`mailto:${provider.providerEmail || ''}`}>
                        Email
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full text-xs font-bold h-10 border-dashed" asChild>
                <a href="tel:911">
                  <Phone className="h-3 w-3 mr-2" />
                  Secondary Emergency Line
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
