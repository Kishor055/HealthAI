"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, MapPin, Navigation, Phone, Search, Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  providerId: z.string().min(1, "Please select a provider"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  type: z.string().min(1, "Consultation type is required"),
  notes: z.string().optional(),
});

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  position: [number, number];
  phone?: string;
}

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookAppointmentDialog({ open, onOpenChange }: BookAppointmentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [nearbyFacilities, setNearbyFacilities] = React.useState<Facility[]>([]);
  const [selectedNearby, setSelectedNearby] = React.useState<Facility | null>(null);

  const providersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: preferredProviders, isLoading: providersLoading } = useCollection(providersQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerId: "",
      date: "",
      time: "10:00",
      type: "Regular Checkup",
      notes: "",
    },
  });

  // Effect to handle nearby selection vs preferred selection
  React.useEffect(() => {
    if (selectedNearby) {
      form.setValue("providerId", selectedNearby.id);
    }
  }, [selectedNearby, form]);

  const scanNearbyHospitals = async () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation Not Supported" });
      return;
    }

    setIsScanning(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const radius = 5000; // 5km
          const queryStr = `[out:json];node["amenity"~"hospital|clinic"](around:${radius},${latitude},${longitude});out 15;`;
          const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryStr)}`);
          const data = await response.json();

          const mapped = data.elements.map((el: any) => ({
            id: el.id.toString(),
            name: el.tags.name || "Medical Facility",
            address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : "Nearby Area",
            type: el.tags.amenity.charAt(0).toUpperCase() + el.tags.amenity.slice(1),
            position: [el.lat, el.lon] as [number, number],
            phone: el.tags.phone || el.tags['contact:phone']
          }));

          setNearbyFacilities(mapped);
          toast({ title: "Scan Complete", description: `Found ${mapped.length} hospitals nearby.` });
        } catch (error) {
          toast({ variant: "destructive", title: "Registry Offline", description: "Could not fetch nearby facilities." });
        } finally {
          setIsScanning(false);
        }
      },
      () => {
        setIsScanning(false);
        toast({ variant: "destructive", title: "Access Denied", description: "Location access is required for scanning." });
      }
    );
  };

  const handleNavigate = (e: React.MouseEvent, facility: Facility) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.position[0]},${facility.position[1]}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    const providerName = selectedNearby 
      ? selectedNearby.name 
      : preferredProviders?.find(p => p.id === values.providerId)?.providerName || "General Practitioner";
    
    try {
      addDocumentNonBlocking(collection(firestore, "users", user.uid, "appointments"), {
        ...values,
        providerName,
        userId: user.uid,
        status: "scheduled",
        isNearbyFacility: !!selectedNearby,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Appointment Booked",
        description: `Your visit with ${providerName} is scheduled for ${values.date}.`,
      });
      onOpenChange(false);
      form.reset();
      setSelectedNearby(null);
      setNearbyFacilities([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Booking Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if(!v) { setNearbyFacilities([]); setSelectedNearby(null); } }}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-background">
        <div className="h-1.5 w-full bg-primary/20" />
        
        <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto clinical-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-foreground">Book Consultation</DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Select a provider from your directory or discover hospitals nearby.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nearby Discovery Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <MapPin className="size-3" /> Regional Discovery
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={scanNearbyHospitals} 
                  disabled={isScanning}
                  className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 text-primary"
                >
                  {isScanning ? <Loader2 className="size-3 animate-spin mr-2" /> : <Search className="size-3 mr-2" />}
                  Rescan Location
                </Button>
              </div>

              <div className="space-y-2">
                {nearbyFacilities.length > 0 ? (
                  <div className="grid gap-2">
                    {nearbyFacilities.map((facility) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={facility.id}
                        onClick={() => setSelectedNearby(facility)}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                          selectedNearby?.id === facility.id ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-muted/20 hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className={cn("size-3", selectedNearby?.id === facility.id ? "text-primary" : "text-muted-foreground")} />
                              <h5 className="font-black text-xs uppercase tracking-tight truncate max-w-[200px]">{facility.name}</h5>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                              {facility.address}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {facility.phone && (
                              <Button size="icon" variant="ghost" className="size-8 rounded-lg" asChild>
                                <a href={`tel:${facility.phone}`} onClick={(e) => e.stopPropagation()}><Phone className="size-3 text-primary" /></a>
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={(e) => handleNavigate(e, facility)}>
                              <Navigation className="size-3 text-accent" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : !isScanning && (
                  <Button 
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-dashed border-primary/20 hover:bg-primary/5 group"
                    onClick={scanNearbyHospitals}
                  >
                    <div className="flex flex-col items-center">
                      <Search className="size-5 text-primary/40 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Find Hospitals Nearby</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="providerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Clinical Provider</FormLabel>
                      <Select onValueChange={(val) => { field.onChange(v); setSelectedNearby(null); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none px-5 text-sm font-bold focus:ring-primary/20">
                            <SelectValue placeholder={providersLoading ? "Loading Directory..." : selectedNearby ? `Selected: ${selectedNearby.name}` : "Choose from Care Team"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {preferredProviders?.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id} className="rounded-xl py-3 px-4 focus:bg-primary/5">
                              <div className="flex flex-col">
                                <span className="font-black uppercase tracking-tight text-xs">{provider.providerName}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">{provider.providerSpecialty}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {(!preferredProviders || preferredProviders.length === 0) && (
                            <div className="p-4 text-center text-[10px] font-bold text-muted-foreground uppercase">Directory Empty</div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Preferred Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-14 rounded-2xl bg-muted/50 border-none px-5 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Time Slot</FormLabel>
                        <FormControl>
                          <Input type="time" className="h-14 rounded-2xl bg-muted/50 border-none px-5 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Clinical Protocol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none px-5 text-sm font-bold">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="Regular Checkup" className="rounded-xl">Regular Checkup</SelectItem>
                          <SelectItem value="Follow-up" className="rounded-xl">Follow-up</SelectItem>
                          <SelectItem value="Emergency" className="rounded-xl">Emergency Consultation</SelectItem>
                          <SelectItem value="Vaccination" className="rounded-xl">Vaccination</SelectItem>
                          <SelectItem value="Diagnostics" className="rounded-xl">Diagnostics Results</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black rounded-[2rem] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Calendar className="mr-3 h-6 w-6" /> Confirm Appointment</>}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
