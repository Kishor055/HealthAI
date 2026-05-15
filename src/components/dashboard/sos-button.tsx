"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function SosButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const handleSOS = () => {
    setIsActivating(true);
    // Simulate emergency sequence
    setTimeout(() => {
      setIsActivating(false);
      setIsOpen(false);
      toast({
        title: "Emergency SOS Activated",
        description: "Emergency services and your primary contact have been notified of your location.",
      });
    }, 2000);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl shadow-destructive/40 bg-destructive hover:bg-destructive/90 transition-transform hover:scale-110 z-50 p-0 border-4 border-white/20"
      >
        <AlertTriangle className="h-8 w-8 animate-pulse text-white" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold text-destructive">EMERGENCY SOS</DialogTitle>
            <DialogDescription className="text-base">
              This will immediately notify emergency services and your primary contacts with your GPS location.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              size="lg" 
              variant="destructive" 
              className="h-16 text-xl font-bold uppercase tracking-widest shadow-lg shadow-destructive/20"
              onClick={handleSOS}
              disabled={isActivating}
            >
              {isActivating ? <Loader2 className="animate-spin mr-2" /> : <Phone className="mr-3 h-6 w-6" />}
              Activate SOS
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setIsOpen(false)}
              disabled={isActivating}
            >
              Cancel
            </Button>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Emergency Contact: Dr. Sarah Johnson
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
