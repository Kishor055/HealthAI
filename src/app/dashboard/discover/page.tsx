"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  MapPin, 
  Star, 
  CheckCircle, 
  Loader2, 
  Info, 
  Compass, 
  ShieldPlus, 
  Activity, 
  Crosshair, 
  Navigation,
  Droplets,
  Microscope,
  Stethoscope,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

const ClinicalMap = dynamic(() => import('@/components/map/clinical-map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/20 flex items-center justify-center">
      <Loader2 className="size-12 animate-spin text-primary opacity-20" />
    </div>
  )
});

const DEFAULT_CENTER: [number, number] = [19.0760, 72.8777]; // Mumbai Default

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  category: 'hospital' | 'blood_bank' | 'diagnostic' | 'clinic';
  position: [number, number];
  phone?: string;
}

const CATEGORIES = [
  { id: 'hospital', label: 'Medical Centers', icon: Stethoscope, query: 'hospital' },
  { id: 'blood_bank', label: 'Blood Banks', icon: Droplets, query: 'blood_bank' },
  { id: 'diagnostic', label: 'Diagnostic Centers', icon: Microscope, query: 'clinic' },
];

export default function DiscoverPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [center, setCenter] = React.useState<[number, number]>(DEFAULT_CENTER);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState('hospital');
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);

  const savedProvidersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: savedProviders } = useCollection(savedProvidersQuery);
  const savedIds = React.useMemo(() => new Set(savedProviders?.map(p => p.providerId) || []), [savedProviders]);

  const scanArea = async (currentPos?: [number, number], category?: string) => {
    const searchPos = currentPos || center;
    const catId = category || selectedCategory;
    setIsSearching(true);
    try {
      const radius = 8000; // 8km
      let queryStr = `[out:json];node["amenity"~"hospital|clinic|pharmacy"](around:${radius},${searchPos[0]},${searchPos[1]});out 40;`;
      
      if (catId === 'blood_bank') {
        queryStr = `[out:json];node["amenity"="blood_bank"](around:${radius},${searchPos[0]},${searchPos[1]});out 40;`;
      } else if (catId === 'diagnostic') {
        queryStr = `[out:json];node["amenity"~"clinic|diagnostic_center"](around:${radius},${searchPos[0]},${searchPos[1]});out 40;`;
      }

      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryStr)}`);
      const data = await response.json();

      const mapped = data.elements.map((el: any) => ({
        id: el.id.toString(),
        name: el.tags.name || (catId === 'blood_bank' ? "Regional Blood Bank" : "Health Center"),
        address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : "Street data unavailable",
        type: el.tags.amenity?.charAt(0).toUpperCase() + el.tags.amenity?.slice(1) || 'Medical Facility',
        category: catId as any,
        position: [el.lat, el.lon] as [number, number],
        phone: el.tags.phone || el.tags['contact:phone'] || "Contact via Nav"
      }));

      setFacilities(mapped);
      toast({
        title: "Regional Scan Complete",
        description: `Located ${mapped.length} ${catId.replace('_', ' ')}s in your vicinity.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registry Sync Offline",
        description: "Unable to reach global medical database.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Not Supported", description: "GPS radio missing." });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(newPos);
        setIsLocating(false);
        scanArea(newPos);
      },
      () => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Access Denied", description: "GPS signal locked." });
      },
      { enableHighAccuracy: true }
    );
  };

  React.useEffect(() => {
    scanArea();
  }, [selectedCategory]);

  const handleSaveProvider = (facility: Facility) => {
    if (!user || !firestore) return;
    const providerRef = doc(firestore, "users", user.uid, "preferredProviders", facility.id);
    setDocumentNonBlocking(providerRef, {
      userId: user.uid,
      providerId: facility.id,
      providerName: facility.name,
      providerAddress: facility.address,
      providerPhone: facility.phone,
      providerSpecialty: facility.type,
      savedAt: new Date().toISOString(),
    }, { merge: true });
    toast({ title: "Provider Registry Updated", description: `${facility.name} added to your care network.` });
  };

  const handleNavigate = (facility: Facility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.position[0]},${facility.position[1]}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-background overflow-hidden font-body"
    >
      <div className="flex-1 relative h-[45vh] md:h-full">
        <ClinicalMap 
          center={center} 
          facilities={facilities} 
          onFacilitySelect={setSelectedFacility}
          selectedId={selectedFacility?.id}
        />
        
        <div className="absolute top-8 left-8 z-[1000] flex gap-2">
           {CATEGORIES.map((cat) => (
             <Button
               key={cat.id}
               onClick={() => setSelectedCategory(cat.id)}
               className={cn(
                 "h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl px-6 transition-all",
                 selectedCategory === cat.id ? "bg-primary text-white scale-105" : "bg-white/90 backdrop-blur-md text-slate-600 hover:bg-white"
               )}
             >
               <cat.icon className="size-4 mr-2" />
               {cat.label}
             </Button>
           ))}
        </div>

        <div className="absolute top-8 right-8 z-[1000] flex flex-col gap-3">
           <Button onClick={handleLocateUser} disabled={isLocating} className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-2xl px-6 group">
             {isLocating ? <Loader2 className="animate-spin mr-2" /> : <Crosshair className="size-5 mr-2 group-hover:scale-110 transition-transform" />}
             Locate Me
           </Button>
           <Button onClick={() => scanArea()} disabled={isSearching} variant="outline" className="h-14 rounded-2xl bg-white/90 backdrop-blur-md text-primary font-black uppercase tracking-widest shadow-2xl border-2 border-primary/20 px-6 group">
             {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Compass className="size-5 mr-2 group-hover:rotate-45 transition-transform" />}
             Rescan Area
           </Button>
        </div>
      </div>

      <aside className="w-full md:w-96 bg-card border-l flex flex-col h-[55vh] md:h-full z-10 shadow-2xl">
        <Tabs defaultValue="nearby" className="flex flex-col h-full">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <Search className="size-6 text-primary" />
              Regional Discovery
            </CardTitle>
            <TabsList className="grid w-full grid-cols-2 mt-4 bg-muted h-12 p-1 rounded-xl">
              <TabsTrigger value="nearby" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background">Facility Registry</TabsTrigger>
              <TabsTrigger value="saved" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background">My Care Network</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-card/50 clinical-scrollbar">
            <TabsContent value="nearby" className="mt-0 space-y-4">
              <AnimatePresence mode="popLayout">
                {facilities.map((facility, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={facility.id}
                    className={cn(
                      "p-5 rounded-[2rem] border-2 transition-all cursor-pointer group relative overflow-hidden",
                      selectedFacility?.id === facility.id ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-background hover:border-primary/20"
                    )}
                    onClick={() => {
                      setSelectedFacility(facility);
                      setCenter(facility.position);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">
                          {facility.category === 'blood_bank' ? 'Emergency Stock' : facility.type}
                       </Badge>
                       {selectedFacility?.id === facility.id && <Activity className="size-3 text-primary animate-pulse" />}
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-tighter leading-tight mb-1">{facility.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-start gap-1">
                      <MapPin className="size-3 mt-0.5 shrink-0" /> {facility.address}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 h-10 rounded-xl" onClick={(e) => { e.stopPropagation(); handleSaveProvider(facility); }} disabled={savedIds.has(facility.id)}>
                        {savedIds.has(facility.id) ? <CheckCircle className="size-4 text-accent" /> : <Star className="size-4" />}
                      </Button>
                      <Button size="icon" variant="outline" className="size-10 rounded-xl border-2" asChild>
                         <a href={`tel:${facility.phone}`} onClick={(e) => e.stopPropagation()}><Phone className="size-4" /></a>
                      </Button>
                      <Button size="sm" className="flex-[3] h-10 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10" onClick={(e) => { e.stopPropagation(); handleNavigate(facility); }}>
                        Navigate <Navigation className="size-3 ml-1.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {facilities.length === 0 && !isSearching && (
                 <div className="text-center py-24 opacity-30">
                    <Compass className="size-16 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Registry Data...</p>
                 </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-0 space-y-4">
              {savedProviders?.map((provider) => (
                <div key={provider.id} className="p-6 rounded-[2.5rem] border-2 border-accent/20 bg-accent/5 space-y-4 group">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tighter">{provider.providerName}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{provider.providerAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl" variant="outline" asChild>
                      <a href={`tel:${provider.providerPhone}`}>Call Now</a>
                    </Button>
                    <Button size="sm" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl bg-accent text-accent-foreground" asChild>
                      <a href="/dashboard/appointments">Book Visit</a>
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </CardContent>
          
          <div className="p-6 border-t bg-muted/20">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
              <ShieldPlus className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-relaxed opacity-70">
                Connected to Clinical Satellite Registry. Real-time stock alerts active for Blood Banks.
              </p>
            </div>
          </div>
        </Tabs>
      </aside>
    </motion.div>
  );
}
