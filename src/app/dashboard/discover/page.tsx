
"use client";

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, CheckCircle, Loader2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const METROPOLIS_CENTER = { lat: 40.7128, lng: -74.0060 };
const MAP_LIBRARIES: ("places")[] = ["places"];

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  position: { lat: number, lng: number };
  phone: string;
}

export default function DiscoverPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // Modern Library Loading Pattern
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-clinical-portal-v2',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: MAP_LIBRARIES
  });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const savedProvidersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: savedProviders } = useCollection(savedProvidersQuery);
  const savedIds = React.useMemo(() => new Set(savedProviders?.map(p => p.providerId) || []), [savedProviders]);

  const searchNearby = React.useCallback((mapInstance: google.maps.Map) => {
    if (!window.google || !window.google.maps.places) return;
    setIsSearching(true);
    
    const service = new google.maps.places.PlacesService(mapInstance);
    const request = {
      location: mapInstance.getCenter() || METROPOLIS_CENTER,
      radius: 5000,
      type: 'hospital'
    };

    service.nearbySearch(request, (results, status) => {
      setIsSearching(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const mapped = results.map(place => ({
          id: place.place_id!,
          name: place.name!,
          address: place.vicinity || "Address hidden",
          type: "Medical Facility",
          position: {
            lat: place.geometry!.location!.lat(),
            lng: place.geometry!.location!.lng()
          },
          phone: "Contact via Navigation"
        }));
        setFacilities(mapped);
      }
    });
  }, []);

  const onMapLoad = React.useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    searchNearby(mapInstance);
  }, [searchNearby]);

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

  if (!isMounted) return null;

  // Handle specific ApiNotActivatedMapError via UI
  if (loadError) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive" className="border-none shadow-2xl bg-destructive/10 text-destructive p-8 rounded-[2.5rem]">
          <AlertCircle className="h-10 w-10 mb-4" />
          <AlertTitle className="text-2xl font-black uppercase tracking-tighter">Maps API Activation Required</AlertTitle>
          <AlertDescription className="mt-4 space-y-6">
            <p className="font-bold text-lg">The Google Maps JS API is failing because it's not enabled for your project.</p>
            <div className="bg-white/40 p-6 rounded-3xl border-2 border-destructive/20 space-y-4">
              <p className="font-black text-xs uppercase tracking-[0.2em] text-destructive">Required Activation Protocol:</p>
              <ol className="list-decimal list-inside space-y-3 text-sm font-bold leading-relaxed">
                <li>Visit the <a href="https://console.cloud.google.com/google/maps-apis/library" target="_blank" className="underline inline-flex items-center gap-1">Maps API Library <ExternalLink className="size-3"/></a></li>
                <li>Search for and <strong>Enable</strong>: "Maps JavaScript API"</li>
                <li>Search for and <strong>Enable</strong>: "Places API"</li>
                <li>Wait 2-3 minutes for the activation to propagate.</li>
              </ol>
            </div>
            <Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-destructive/20" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-background overflow-hidden">
      <div className="flex-1 relative h-[40vh] md:h-full">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-12 animate-spin text-primary opacity-30" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Loading Map Lab...</span>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={METROPOLIS_CENTER}
            zoom={13}
            onLoad={onMapLoad}
            options={{ 
              disableDefaultUI: false,
              styles: [
                { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#334155" }] },
                { featureType: "water", stylers: [{ color: "#e2e8f0" }] }
              ]
            }}
          >
            {facilities.map((facility) => (
              <Marker
                key={facility.id}
                position={facility.position}
                onClick={() => setSelectedFacility(facility)}
              />
            ))}
          </GoogleMap>
        )}
      </div>

      <aside className="w-full md:w-96 bg-card border-l flex flex-col h-[60vh] md:h-full z-10 shadow-2xl">
        <Tabs defaultValue="nearby" className="flex flex-col h-full">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="text-2xl font-black font-headline tracking-tighter flex items-center gap-3">
              <Search className="size-6 text-primary" />
              Discover Care
            </CardTitle>
            <TabsList className="grid w-full grid-cols-2 mt-4 bg-muted h-12 p-1">
              <TabsTrigger value="nearby" className="text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-background">Nearby</TabsTrigger>
              <TabsTrigger value="saved" className="text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-background">Preferred</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            <TabsContent value="nearby" className="mt-0 space-y-4">
              {isSearching && (
                <div className="flex flex-col items-center py-20 opacity-30">
                  <Loader2 className="animate-spin size-8 mb-4" /> 
                  <span className="text-[10px] font-black uppercase tracking-widest">Scanning Grid...</span>
                </div>
              )}
              {facilities.map((facility, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={facility.id}
                  className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all cursor-pointer group",
                    selectedFacility?.id === facility.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/20"
                  )}
                  onClick={() => {
                    setSelectedFacility(facility);
                    map?.panTo(facility.position);
                  }}
                >
                  <h3 className="font-black text-sm uppercase tracking-tighter leading-tight">{facility.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium line-clamp-1 flex items-center gap-1">
                    <MapPin className="size-3" /> {facility.address}
                  </p>
                  <div className="flex gap-2 mt-5">
                    <Button size="sm" variant="outline" className="flex-1 h-10 rounded-xl" onClick={(e) => { e.stopPropagation(); handleSaveProvider(facility); }} disabled={savedIds.has(facility.id)}>
                      {savedIds.has(facility.id) ? <CheckCircle className="size-4 text-accent" /> : <Star className="size-4" />}
                    </Button>
                    <Button size="sm" className="flex-[3] h-10 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10" asChild>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position.lat},${facility.position.lng}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        Navigation
                      </a>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="saved" className="mt-0 space-y-4">
              {savedProviders?.map((provider) => (
                <div key={provider.id} className="p-5 rounded-[2rem] border-2 border-primary/20 bg-primary/5 space-y-4">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tighter">{provider.providerName}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{provider.providerAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-10 text-[10px] font-black uppercase" variant="outline" asChild>
                      <a href={`tel:${provider.providerPhone}`}>Call</a>
                    </Button>
                    <Button size="sm" className="flex-1 h-10 text-[10px] font-black uppercase" variant="destructive" asChild>
                      <a href="/dashboard/appointments">Book</a>
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
          
          <div className="p-6 border-t bg-muted/10">
            <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-relaxed opacity-70">
                Maps Lab loading pattern enabled for enhanced clinic discovery.
              </p>
            </div>
          </div>
        </Tabs>
      </aside>
    </div>
  );
}
