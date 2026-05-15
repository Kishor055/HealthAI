
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, User, Loader2, ExternalLink } from "lucide-react";
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
          <DialogTitle>Contact Healthcare Provider</DialogTitle>
          <DialogDescription>
            Reach out to your saved doctors or emergency contacts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !preferredProviders || preferredProviders.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-muted-foreground">No preferred providers saved yet.</p>
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:911">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Emergency Services
                </a>
              </Button>
            </div>
          ) : (
            preferredProviders.map((provider) => (
              <div key={provider.id} className="p-4 rounded-xl border-2 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{provider.providerName}</h4>
                      <p className="text-xs text-muted-foreground">{provider.providerSpecialty}</p>
                    </div>
                  </div>
                  {provider.providerEmail && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 font-bold" asChild>
                    <a href={`tel:${provider.providerPhone || '000-000-0000'}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 font-bold" asChild suppressHydrationWarning>
                    <a href={`mailto:${provider.providerEmail || ''}`}>
                      Email
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
