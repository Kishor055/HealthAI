"use client";

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation, Loader2, Hospital, Building2, Pill, AlertCircle, ExternalLink, Star, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  const [savedIds, setSavedIds] = React.useState<Set<string>>(new Set());

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
    if (window.google) {
      searchNearbyHospitals(map);
    }
  }, []);

  const searchNearbyHospitals = (mapInstance: google.maps.Map) => {
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
            title: "API Permission Denied",
            message: "The Google Places API is disabled or restricted. Ensure 'Maps JavaScript API' AND 'Places API' are enabled in your Google Cloud Console.",
            type: 'denied'
          });
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setFacilities([]);
        } else {
          setErrorState({
            title: "Service Error",
            message: `Map service returned status: ${status}. This often means an API is not activated for this key.`,
            type: 'error'
          });
        }
      });
    } catch (e) {
      setIsSearching(false);
      setErrorState({
        title: "Initialization Error",
        message: "Failed to initialize Places Service. Verify your APIs are enabled.",
        type: 'error'
      });
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

    setSavedIds(prev => new Set(prev).add(facility.id));

    toast({
      title: "Provider Saved",
      description: `${facility.name} added to your favorites.`,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Hospital': return <Hospital className="size-4" />;
      case 'Clinic': return <Building2 className="size-4" />;
      case 'Pill': return <Pill className="size-4" />;
      default: return <MapPin className="size-4" />;
    }
  };

  if (loadError) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive" className="border-2 shadow-xl" suppressHydrationWarning>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Google Maps Load Error</AlertTitle>
          <AlertDescription className="mt-2 text-sm space-y-4">
            <p>The Google Maps script failed to load. This is likely due to an unactivated API in your console.</p>
            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 font-mono text-[11px] leading-relaxed">
              Error: ApiNotActivatedMapError
            </div>
            <div className="space-y-2">
              <p className="font-bold">How to fix this:</p>
              <ol className="list-decimal list-inside space-y-1 opacity-80">
                <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" className="underline font-bold">Google Cloud Console</a>.</li>
                <li>Select your project.</li>
                <li>Go to <strong>APIs & Services</strong> > <strong>Library</strong>.</li>
                <li>Search for and Enable: <strong>"Maps JavaScript API"</strong></li>
                <li>Search for and Enable: <strong>"Places API"</strong></li>
              </ol>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-4" onClick={() => window.location.reload()}>
              Reload Page After Enabling
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!apiKey || apiKey.includes('---')) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Alert variant="destructive" className="border-2" suppressHydrationWarning>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Missing API Key</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            Please update your <code>.env</code> file with a valid <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
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
            <div className="text-center space-y-4">
              <Loader2 className="size-12 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">Connecting to Maps Engine...</p>
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
                { featureType: "poi.business", stylers: [{ visibility: "on" }] },
                { featureType: "transit", stylers: [{ visibility: "on" }] }
              ],
            }}
          >
            {facilities.map((facility) => (
              <Marker
                key={facility.id}
                position={facility.position}
                onClick={() => setSelectedFacility(facility)}
                title={facility.name}
              />
            ))}

            {selectedFacility && (
              <InfoWindow
                position={selectedFacility.position}
                onCloseClick={() => setSelectedFacility(null)}
              >
                <div className="p-2 max-w-[220px]">
                  <h3 className="font-bold text-sm mb-1 text-primary">{selectedFacility.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{selectedFacility.address}</p>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full h-8 text-[10px] font-bold" asChild suppressHydrationWarning>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.position.lat},${selectedFacility.position.lng}`} target="_blank" rel="noreferrer">
                        <Navigation className="size-3 mr-1.5" /> Navigate
                      </a>
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full h-8 text-[10px] font-bold" 
                        onClick={() => handleSaveProvider(selectedFacility)}
                        disabled={savedIds.has(selectedFacility.id)}
                        suppressHydrationWarning
                    >
                      {savedIds.has(selectedFacility.id) ? (
                          <><CheckCircle className="size-3 mr-1.5 text-accent" /> Saved</>
                      ) : (
                          <><Star className="size-3 mr-1.5" /> Save to Favorites</>
                      )}
                    </Button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}

        <AnimatePresence>
          {errorState && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50"
            >
              <Alert variant="destructive" className="shadow-2xl border-2 bg-background/95 backdrop-blur-md" suppressHydrationWarning>
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="font-bold">{errorState.title}</AlertTitle>
                <AlertDescription className="mt-2 text-xs leading-relaxed">
                  {errorState.message}
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] bg-background" asChild suppressHydrationWarning>
                      <a href="https://console.cloud.google.com/google/maps-apis/library" target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3 mr-1" /> Cloud Console
                      </a>
                    </Button>
                    <Button size="sm" className="h-7 text-[10px]" onClick={() => window.location.reload()} suppressHydrationWarning>
                      Retry
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="w-full md:w-80 lg:w-96 bg-background border-l flex flex-col h-[60vh] md:h-full z-10 shadow-2xl">
        <Card className="flex-1 border-none shadow-none flex flex-col rounded-none overflow-hidden">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Facility Locator
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {isSearching ? "Searching nearby..." : `Discovered ${facilities.length} providers.`}
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {isSearching && facilities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-medium">Scanning for facilities...</p>
              </div>
            )}
            
            {!isSearching && facilities.length === 0 && !errorState && (
              <div className="text-center py-20 text-muted-foreground">
                <Hospital className="size-16 mx-auto mb-4 opacity-10" />
                <p className="text-sm font-medium">No results found.</p>
                <p className="text-xs mt-1">Try moving the map to another area.</p>
              </div>
            )}

            {facilities.map((facility, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={facility.id}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:shadow-lg",
                  selectedFacility?.id === facility.id 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-border bg-card hover:border-primary/30"
                )}
                onClick={() => handleFacilityClick(facility)}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform",
                    facility.type === 'Hospital' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                  )}>
                    {getIcon(facility.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm leading-tight text-foreground truncate">{facility.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{facility.address}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-1 h-8 text-[11px] font-bold" 
                    onClick={(e) => { e.stopPropagation(); handleSaveProvider(facility); }}
                    disabled={savedIds.has(facility.id)}
                    suppressHydrationWarning
                  >
                    {savedIds.has(facility.id) ? (
                        <CheckCircle className="size-3 text-accent" />
                    ) : (
                        <Star className="size-3" />
                    )}
                  </Button>
                  <Button size="sm" className="flex-2 h-8 text-[11px] font-bold shadow-lg shadow-primary/20" asChild suppressHydrationWarning>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position.lat},${facility.position.lng}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Navigation className="size-3 mr-1.5" /> Navigate
                    </a>
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
