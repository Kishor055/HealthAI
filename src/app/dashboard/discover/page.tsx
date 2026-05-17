
"use client";

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation, Loader2, Hospital, Building2, Pill, AlertCircle, ExternalLink, Star, CheckCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const METROPOLIS_CENTER = { lat: 40.7128, lng: -74.0060 };
const LIBRARIES: ("places")[] = ["places"];

interface Facility {
  id: string;
  name: string;
  address: string;
  distance: string;
  type: string;
  position: { lat: number, lng: number };
  phone: string;
}

export default function DiscoverPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || "",
    libraries: LIBRARIES
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [errorState, setErrorState] = React.useState<{ title: string; message: string; type: 'missing' | 'denied' | 'error' | 'not-activated' } | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Fetch saved providers
  const savedProvidersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "preferredProviders"));
  }, [firestore, user?.uid]);

  const { data: savedProviders } = useCollection(savedProvidersQuery);
  const savedIds = React.useMemo(() => new Set(savedProviders?.map(p => p.id) || []), [savedProviders]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
    if (window.google) {
      searchNearbyHospitals(map);
    }
  }, []);

  const searchNearbyHospitals = (mapInstance: google.maps.Map) => {
    if (!window.google) return;
    setIsSearching(true);
    setErrorState(null);
    
    try {
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
            address: place.vicinity || "Address not available",
            distance: "Nearby",
            type: "Hospital",
            position: {
              lat: place.geometry!.location!.lat(),
              lng: place.geometry!.location!.lng()
            },
            phone: "Contact for details"
          }));
          setFacilities(mapped);
        } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          setErrorState({
            title: "API Activation Error",
            message: "The Google Maps JavaScript API or Places API is not activated for this key.",
            type: 'not-activated'
          });
        }
      });
    } catch (e) {
      setIsSearching(false);
    }
  };

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    if (map) {
      map.panTo(facility.position);
      map.setZoom(16);
    }
  };

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
      description: `${facility.name} added to your favorites.`,
    });
  };

  if (!isMounted) return null;

  if (loadError || errorState?.type === 'not-activated') {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive" className="border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <AlertCircle className="h-6 w-6" />
          <AlertTitle className="text-xl font-black uppercase tracking-tighter">Maps Library Integration Required</AlertTitle>
          <AlertDescription className="mt-4 text-sm space-y-4">
            <p className="font-medium">The Google Maps engine requires explicit activation of the <code className="bg-destructive/10 px-1.5 py-0.5 rounded font-black">Places API</code> and <code className="bg-destructive/10 px-1.5 py-0.5 rounded font-black">Maps JavaScript API</code>.</p>
            <div className="bg-muted p-5 rounded-2xl border-2 space-y-3">
              <p className="font-black text-xs uppercase tracking-widest text-primary">Required Steps:</p>
              <ol className="list-decimal list-inside space-y-2 text-xs font-medium">
                <li>Visit the Google Cloud Console.</li>
                <li>Enable <strong>Maps JavaScript API</strong>.</li>
                <li>Enable <strong>Places API</strong>.</li>
              </ol>
            </div>
            <Button className="w-full h-12 rounded-xl font-black" onClick={() => window.location.reload()}>Retry Portal Connection</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden bg-muted/20">
      <div className="flex-1 relative h-[40vh] md:h-full">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="size-12 animate-spin text-primary" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={METROPOLIS_CENTER}
            zoom={13}
            onLoad={onMapLoad}
            options={{ disableDefaultUI: false }}
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

      <aside className="w-full md:w-80 lg:w-96 bg-background border-l flex flex-col h-[60vh] md:h-full z-10 shadow-2xl">
        <Tabs defaultValue="nearby" className="flex flex-col h-full">
          <CardHeader className="bg-primary/5 pb-0 border-b">
            <CardTitle className="text-xl font-black font-headline tracking-tighter flex items-center gap-2">
              <Search className="size-5 text-primary" />
              Discover
            </CardTitle>
            <TabsList className="grid w-full grid-cols-2 mt-4 bg-muted h-10">
              <TabsTrigger value="nearby" className="text-[10px] font-black uppercase">Nearby</TabsTrigger>
              <TabsTrigger value="saved" className="text-[10px] font-black uppercase">Saved</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4">
            <TabsContent value="nearby" className="mt-0 space-y-4">
              {isSearching && (
                <div className="flex flex-col items-center py-12 opacity-50"><Loader2 className="animate-spin mb-2" /> <span className="text-[10px] font-black uppercase">Scanning...</span></div>
              )}
              {facilities.map((facility, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={facility.id}
                  className={cn("p-4 rounded-3xl border-2 transition-all cursor-pointer", selectedFacility?.id === facility.id ? "border-primary bg-primary/5" : "border-border bg-card")}
                  onClick={() => handleFacilityClick(facility)}
                >
                  <h3 className="font-black text-sm uppercase tracking-tighter truncate">{facility.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{facility.address}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="ghost" className="flex-1 h-9" onClick={(e) => { e.stopPropagation(); handleSaveProvider(facility); }} disabled={savedIds.has(facility.id)}>
                      {savedIds.has(facility.id) ? <CheckCircle className="size-3 text-accent" /> : <Star className="size-3" />}
                    </Button>
                    <Button size="sm" className="flex-2 h-9 text-[10px] font-black uppercase" asChild>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position.lat},${facility.position.lng}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        Navigate
                      </a>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="saved" className="mt-0 space-y-4">
              {savedProviders?.map((provider) => (
                <div key={provider.id} className="p-4 rounded-3xl border-2 border-primary/20 bg-primary/5">
                  <h3 className="font-black text-sm uppercase tracking-tighter">{provider.providerName}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">{provider.providerAddress}</p>
                  <Button size="sm" className="w-full mt-4 h-9 text-[10px] font-black uppercase" variant="outline" asChild>
                    <a href={`tel:${provider.providerPhone}`}>Call Provider</a>
                  </Button>
                </div>
              ))}
              {(!savedProviders || savedProviders.length === 0) && (
                <div className="text-center py-20 opacity-30">
                  <Star className="size-12 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Saved Providers</p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </aside>
    </div>
  );
}
