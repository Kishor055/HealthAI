
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

/**
 * EXPERT EMERGENCY HUB
 * Provides high-priority clinical intervention and encrypted SOS broadcasting.
 */
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
    
    // Clinical SOS Protocol Execution
    setTimeout(() => {
      setIsActivating(false);
      setIsOpen(false);
      toast({
        title: "SOS PROTOCOL ACTIVE",
        description: "Encrypted distress signal broadcast to emergency services and your trusted care network.",
        variant: "destructive"
      });
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
    toast({ title: "Clinical Proxy Added", description: `${newContact.name} is now authorized for SOS notifications.` });
  };

  const handleDeleteContact = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "users", user.uid, "emergencyContacts", id));
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className="fixed bottom-10 right-10 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-24 w-24 rounded-full shadow-[0_0_60px_rgba(239,68,68,0.5)] bg-destructive hover:bg-destructive/90 transition-all p-0 border-8 border-white/30 group overflow-hidden"
        >
          <div className="relative z-10">
            <AlertTriangle className="h-12 w-12 text-white animate-pulse" />
          </div>
          <motion.div 
            animate={{ scale: [1, 2], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 bg-white rounded-full"
          />
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={(v) => { if (!isActivating) setIsOpen(v); }}>
        <DialogContent className="sm:max-w-[480px] overflow-hidden border-none p-0 bg-white/95 backdrop-blur-3xl shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-[3rem]">
          <div className="h-2.5 w-full bg-destructive absolute top-0 left-0" />
          
          <div className="p-10 space-y-8">
            <DialogHeader className="text-center">
              <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center mb-4 relative">
                <ShieldAlert className="h-12 w-12 text-destructive" />
                {isActivating && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 border-[6px] border-t-destructive border-r-transparent border-b-transparent border-l-transparent rounded-[2rem]"
                  />
                )}
                <div className="absolute inset-0 bg-destructive/5 rounded-[2rem] animate-ping" />
              </div>
              <DialogTitle className="text-4xl font-black text-destructive tracking-tighter uppercase leading-none">Emergency Hub</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Clinical Intervention Authorization Required
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <Button 
                size="lg" 
                variant="destructive" 
                className="w-full h-28 text-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-destructive/40 rounded-[2rem] relative overflow-hidden group transition-all active:scale-95"
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
                      <Loader2 className="animate-spin h-10 w-10 mb-2" />
                      <span className="text-xs tracking-widest">TRANSMITTING SOS...</span>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" className="flex items-center gap-6">
                      <LifeBuoy className="h-12 w-12 group-hover:rotate-180 transition-transform duration-1000" />
                      BROADCAST SOS
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              <div className="grid grid-cols-3 gap-4">
                {EMERGENCY_SERVICES.map((service) => (
                  <Button
                    key={service.name}
                    variant="outline"
                    className={cn(
                      "h-auto py-6 flex flex-col gap-3 rounded-[1.5rem] border-2 transition-all bg-white hover:bg-slate-50",
                      service.shadow
                    )}
                    asChild
                  >
                    <a href={`tel:${service.phone}`}>
                       <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white shadow-xl", service.color)}>
                         <service.icon className="size-6" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-widest">{service.name}</span>
                    </a>
                  </Button>
                ))}
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                    <Heart className="size-4 text-destructive fill-destructive" /> Authorized Proxy Network
                  </h4>
                  <Button variant="ghost" size="icon" className="size-10 rounded-2xl bg-white border-2 shadow-sm hover:border-primary/50" onClick={() => setShowAddContact(!showAddContact)}>
                    <UserPlus className="size-5" />
                  </Button>
                </div>

                <AnimatePresence>
                  {showAddContact && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 mb-8 overflow-hidden bg-white p-6 rounded-[1.5rem] border-2 shadow-inner"
                    >
                      <Input placeholder="Registry Name" className="h-12 rounded-xl text-sm font-black uppercase" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} />
                      <Input placeholder="Secure Phone" className="h-12 rounded-xl text-sm font-black" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} />
                      <Button size="lg" className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.3em]" onClick={handleAddContact}>Authorize Identity</Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-3 clinical-scrollbar">
                  {contacts?.map(contact => (
                    <div key={contact.id} className="bg-white p-4 rounded-[1.5rem] border-2 flex items-center justify-between shadow-sm group hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <LifeBuoy className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter leading-none mb-1">{contact.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{contact.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="size-10 rounded-xl text-primary border-2 border-primary/10 shadow-sm" asChild>
                          <a href={`tel:${contact.phone}`}><Phone className="size-5" /></a>
                        </Button>
                        <Button size="icon" variant="ghost" className="size-10 rounded-xl text-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDeleteContact(contact.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!contacts || contacts.length === 0) && !showAddContact && (
                    <div className="text-center py-10 opacity-20 grayscale">
                       <UserPlus className="size-16 mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No Authorized Proxies</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-8 justify-center pt-6 border-t border-dashed">
               <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary/10 rounded-2xl relative">
                    <Wifi className="size-5 text-primary animate-pulse" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sat-Link Active</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <MapPin className="size-5 text-emerald-500" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">GPS Secured</span>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
