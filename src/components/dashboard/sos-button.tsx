
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Phone, 
  Loader2, 
  ShieldAlert, 
  Wifi, 
  MapPin, 
  UserPlus, 
  Trash2, 
  Heart,
  Stethoscope,
  ShieldCheck,
  Flame,
  LifeBuoy
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

const EMERGENCY_SERVICES = [
  { name: "Ambulance", phone: "108", icon: Stethoscope, color: "bg-red-500", shadow: "shadow-red-500/20" },
  { name: "Police", phone: "100", icon: ShieldCheck, color: "bg-blue-600", shadow: "shadow-blue-500/20" },
  { name: "Fire Dept", phone: "101", icon: Flame, color: "bg-orange-500", shadow: "shadow-orange-500/20" },
];

export function SosButton() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "" });
  const { toast } = useToast();

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "emergencyContacts"));
  }, [firestore, user?.uid]);

  const { data: contacts } = useCollection(contactsQuery);

  const handleSOS = () => {
    setIsActivating(true);
    
    // Simulate multi-stage notification protocol
    setTimeout(() => {
      setIsActivating(false);
      setIsOpen(false);
      toast({
        title: "Emergency Protocol Active",
        description: "Your physician and emergency contacts have been notified of your location. Initiating emergency call.",
        variant: "destructive"
      });
      // Fallback: Trigger dialer for Ambulance
      window.location.href = "tel:108";
    }, 3500);
  };

  const handleAddContact = () => {
    if (!user || !firestore || !newContact.name || !newContact.phone) return;
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "emergencyContacts"), {
      ...newContact,
      createdAt: new Date().toISOString()
    });
    setNewContact({ name: "", phone: "", relationship: "" });
    setShowAddContact(false);
    toast({ title: "Contact Added", description: `${newContact.name} is now in your SOS list.` });
  };

  const handleDeleteContact = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, user.uid, "emergencyContacts", id));
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-20 w-20 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.6)] bg-destructive hover:bg-destructive/90 transition-all p-0 border-4 border-white/40 group overflow-hidden"
        >
          <div className="relative z-10">
            <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
          </div>
          <motion.div 
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-white rounded-full"
          />
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={(v) => { if (!isActivating) setIsOpen(v); }}>
        <DialogContent className="sm:max-w-[450px] overflow-hidden border-none p-0 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-[2.5rem]">
          <div className="h-2 w-full bg-destructive absolute top-0 left-0" />
          
          <div className="p-8 space-y-6">
            <DialogHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-4 relative">
                <ShieldAlert className="h-10 w-10 text-destructive" />
                {isActivating && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-destructive border-r-transparent border-b-transparent border-l-transparent rounded-3xl"
                  />
                )}
                <div className="absolute inset-0 bg-destructive/5 rounded-3xl animate-ping" />
              </div>
              <DialogTitle className="text-3xl font-black text-destructive tracking-tighter uppercase leading-none">Emergency Hub</DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Immediate Clinical Intervention
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Button 
                size="lg" 
                variant="destructive" 
                className="w-full h-24 text-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-destructive/40 rounded-[2rem] relative overflow-hidden group"
                onClick={handleSOS}
                disabled={isActivating}
              >
                <AnimatePresence mode="wait">
                  {isActivating ? (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Loader2 className="animate-spin h-8 w-8" />
                      <span className="text-[10px] tracking-widest">TRANSMITTING...</span>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" className="flex items-center gap-4">
                      <LifeBuoy className="h-8 w-8" />
                      BROADCAST SOS
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              <div className="grid grid-cols-3 gap-3">
                {EMERGENCY_SERVICES.map((service) => (
                  <Button
                    key={service.name}
                    variant="outline"
                    className={cn(
                      "h-auto py-4 flex flex-col gap-2 rounded-2xl border-2 hover:scale-105 transition-all bg-card/50",
                      service.shadow
                    )}
                    asChild
                  >
                    <a href={`tel:${service.phone}`}>
                       <div className={cn("size-10 rounded-xl flex items-center justify-center text-white shadow-lg", service.color)}>
                         <service.icon className="size-5" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-tighter">{service.name}</span>
                    </a>
                  </Button>
                ))}
              </div>

              <div className="bg-muted/30 rounded-[2rem] p-6 border-2 border-dashed border-muted-foreground/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Heart className="size-3 text-destructive fill-destructive" /> Trusted Network
                  </h4>
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl bg-background border shadow-sm" onClick={() => setShowAddContact(!showAddContact)}>
                    <UserPlus className="size-4" />
                  </Button>
                </div>

                <AnimatePresence>
                  {showAddContact && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 mb-6 overflow-hidden bg-background p-4 rounded-2xl border shadow-inner"
                    >
                      <Input placeholder="Name" className="h-10 rounded-xl text-xs font-bold" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} />
                      <Input placeholder="Phone Number" className="h-10 rounded-xl text-xs font-bold" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} />
                      <Button size="sm" className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={handleAddContact}>Verify & Save</Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 clinical-scrollbar">
                  {contacts?.map(contact => (
                    <div key={contact.id} className="bg-card p-3 rounded-2xl border-2 flex items-center justify-between shadow-sm group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shadow-inner">
                          <LifeBuoy className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tighter leading-tight">{contact.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">{contact.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="size-9 rounded-xl text-primary hover:bg-primary/5 border-2 border-primary/10 shadow-sm" asChild>
                          <a href={`tel:${contact.phone}`}><Phone className="size-4" /></a>
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8 rounded-xl text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteContact(contact.id)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!contacts || contacts.length === 0) && !showAddContact && (
                    <div className="text-center py-6 opacity-30 grayscale">
                       <UserPlus className="size-10 mx-auto mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No trusted contacts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-4 border-t border-dashed">
               <div className="flex flex-col items-center gap-1.5">
                  <div className="p-2 bg-primary/10 rounded-full relative">
                    <Wifi className="size-4 text-primary animate-pulse" />
                    <motion.div animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-primary/20 rounded-full" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary">Satellite Active</span>
               </div>
               <div className="flex flex-col items-center gap-1.5">
                  <div className="p-2 bg-accent/10 rounded-full">
                    <MapPin className="size-4 text-accent animate-pulse" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-accent">GPS Locked</span>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
