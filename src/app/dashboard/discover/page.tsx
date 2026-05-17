
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, CheckCircle, Loader2, Info, Compass, ShieldPlus, ArrowRight, Activity, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

// Dynamically import Leaflet Map to avoid SSR issues
const ClinicalMap = dynamic(() => import('@/components/map/clinical-map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/20 flex items-center justify-center">
      <Loader2 className="size-12 animate-spin text-primary opacity-20" />
    </div>
  )
});

const DEFAULT_CENTER: [number, number] = [40.7128, -74.0060]; // NYC

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  position: [number, number];
  phone?: string;
}

export default function DiscoverPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [center, setCenter] = React.useState<[number, number]>(DEFAULT_CENTER);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);

  // Fetch saved providers
  const savedProvidersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: savedProviders } = useCollection(savedProvidersQuery);
  const savedIds = React.useMemo(() => new Set(savedProviders?.map(p => p.providerId) || []), [savedProviders]);

  // Real-time facility scan via Overpass API (OpenStreetMap)
  const scanArea = async (currentPos?: [number, number]) => {
    const searchPos = currentPos || center;
    setIsSearching(true);
    try {
      const radius = 5000; // 5km
      // Overpass query for hospitals and clinics
      const query = `[out:json];node["amenity"~"hospital|clinic|pharmacy"](around:${radius},${searchPos[0]},${searchPos[1]});out 30;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();

      const mapped = data.elements.map((el: any) => ({
        id: el.id.toString(),
        name: el.tags.name || "Medical Facility",
        address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : "Street data unavailable",
        type: el.tags.amenity.charAt(0).toUpperCase() + el.tags.amenity.slice(1),
        position: [el.lat, el.lon] as [number, number],
        phone: el.tags.phone || "Contact via Nav"
      }));

      setFacilities(mapped);
      toast({
        title: "Area Scan Complete",
        description: `Found ${mapped.length} clinical facilities in your vicinity.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Unable to connect to healthcare registry. Please retry.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Your browser does not support geolocation.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(newPos);
        setIsLocating(false);
        toast({
          title: "Location Accessed",
          description: "Centering map on your current position.",
        });
        // Auto-scan new location
        scanArea(newPos);
      },
      (error) => {
        setIsLocating(false);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Unable to retrieve your location. Please check permissions.",
        });
      },
      { enableHighAccuracy: true }
    );
  };

  React.useEffect(() => {
    scanArea();
  }, []);

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

    toast({
      title: "Provider Saved",
      description: `${facility.name} added to your preferred care team.`,
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-background overflow-hidden font-body">
      {/* Map Viewport */}
      <div className="flex-1 relative h-[45vh] md:h-full group">
        <ClinicalMap 
          center={center} 
          facilities={facilities} 
          onFacilitySelect={setSelectedFacility}
          selectedId={selectedFacility?.id}
        />
        
        {/* Map Overlay Controls */}
        <div className="absolute top-8 right-8 z-[1000] flex flex-col gap-3">
           <Button 
            onClick={handleLocateUser}
            disabled={isLocating}
            className="h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest shadow-2xl px-6 group"
           >
             {isLocating ? <Loader2 className="animate-spin mr-2" /> : <Crosshair className="size-5 mr-2 group-hover:scale-110 transition-transform" />}
             Locate Me
           </Button>
           
           <Button 
            onClick={() => scanArea()} 
            disabled={isSearching}
            variant="outline"
            className="h-14 rounded-2xl bg-white/90 backdrop-blur-md text-primary hover:bg-white font-black uppercase tracking-widest shadow-2xl border-2 border-primary/20 px-6 group"
           >
             {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Compass className="size-5 mr-2 group-hover:rotate-45 transition-transform" />}
             Rescan Area
           </Button>

           <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-primary/10 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                 <ShieldPlus className="size-6" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Discovery Mode</p>
                 <p className="text-xs font-bold">Clinical Precision Active</p>
              </div>
           </div>
        </div>
      </div>

      {/* Discovery Sidebar */}
      <aside className="w-full md:w-96 bg-card border-l flex flex-col h-[55vh] md:h-full z-10 shadow-2xl">
        <Tabs defaultValue="nearby" className="flex flex-col h-full">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-2xl font-black font-headline tracking-tighter flex items-center gap-3">
              <Search className="size-6 text-primary" />
              Care Finder
            </CardTitle>
            <TabsList className="grid w-full grid-cols-2 mt-4 bg-muted h-12 p-1 rounded-xl">
              <TabsTrigger value="nearby" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background">Registry</TabsTrigger>
              <TabsTrigger value="saved" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background">Favorites</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-card/50">
            <TabsContent value="nearby" className="mt-0 space-y-4">
              <AnimatePresence mode="popLayout">
                {facilities.map((facility, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={facility.id}
                    className={cn(
                      "p-5 rounded-[2.25rem] border-2 transition-all cursor-pointer group relative overflow-hidden",
                      selectedFacility?.id === facility.id ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-background hover:border-primary/20"
                    )}
                    onClick={() => {
                      setSelectedFacility(facility);
                      setCenter(facility.position);
                    }}
                  >
                    {selectedFacility?.id === facility.id && (
                       <motion.div layoutId="active-indicator" className="absolute top-0 right-0 p-4">
                          <Activity className="size-4 text-primary animate-pulse" />
                       </motion.div>
                    )}
                    <Badge variant="outline" className="mb-3 text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">{facility.type}</Badge>
                    <h3 className="font-black text-sm uppercase tracking-tighter leading-tight">{facility.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium line-clamp-1 flex items-center gap-1">
                      <MapPin className="size-3" /> {facility.address}
                    </p>
                    <div className="flex gap-2 mt-5">
                      <Button size="sm" variant="outline" className="flex-1 h-10 rounded-xl" onClick={(e) => { e.stopPropagation(); handleSaveProvider(facility); }} disabled={savedIds.has(facility.id)}>
                        {savedIds.has(facility.id) ? <CheckCircle className="size-4 text-accent" /> : <Star className="size-4" />}
                      </Button>
                      <Button size="sm" className="flex-[3] h-10 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10" asChild>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position[0]},${facility.position[1]}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          Navigate <ArrowRight className="size-3 ml-1.5" />
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {facilities.length === 0 && !isSearching && (
                 <div className="text-center py-24 opacity-30">
                    <Compass className="size-16 mx-auto mb-4 animate-spin-slow" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Scanning Registry...</p>
                 </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-0 space-y-4">
              {savedProviders?.map((provider) => (
                <div key={provider.id} className="p-6 rounded-[2.5rem] border-2 border-accent/20 bg-accent/5 space-y-4 group">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <Star className="size-3 text-accent fill-accent" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-accent">Preferred Care</span>
                    </div>
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
              {(!savedProviders || savedProviders.length === 0) && (
                <div className="text-center py-24 opacity-30">
                  <Star className="size-16 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Care Records</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
          
          <div className="p-6 border-t bg-muted/20">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-relaxed opacity-70">
                Using clinical Overpass/OSRM protocols. Search is powered by OpenStreetMap global medical registry.
              </p>
            </div>
          </div>
        </Tabs>
      </aside>
    </div>
  );
}
