
"use client";

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation, Loader2, Hospital, Building2, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [facilities, setFacilities] = React.useState<Facility[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const onMapLoad = React.useCallback((map: google.maps.Map) => {
    setMap(map);
    if (window.google) {
      searchNearbyHospitals(map);
    }
  }, []);

  const searchNearbyHospitals = (mapInstance: google.maps.Map) => {
    setIsSearching(true);
    const service = new google.maps.places.PlacesService(mapInstance);
    const request = {
      location: METROPOLIS_CENTER,
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
          phone: "Contact via details"
        }));
        setFacilities(mapped);
      }
    });
  };

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    if (map) {
      map.panTo(facility.position);
      map.setZoom(16);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Hospital': return <Hospital className="size-4" />;
      case 'Clinic': return <Building2 className="size-4" />;
      case 'Pharmacy': return <Pill className="size-4" />;
      default: return <MapPin className="size-4" />;
    }
  };

  if (loadError) {
    return <div className="p-8 text-center text-destructive">Error loading Google Maps. Please check your API key.</div>;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
      <div className="flex-1 relative h-[40vh] md:h-full bg-muted">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="size-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Initializing map...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={METROPOLIS_CENTER}
            zoom={13}
            onLoad={onMapLoad}
            onUnmount={onUnmount}
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
                <div className="p-2 max-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{selectedFacility.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{selectedFacility.address}</p>
                  <Button size="sm" className="w-full h-7 text-[10px]" asChild>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.position.lat},${selectedFacility.position.lng}`} target="_blank" rel="noreferrer">
                      <Navigation className="size-2 mr-1" /> Get Directions
                    </a>
                  </Button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      <aside className="w-full md:w-80 lg:w-96 bg-background border-l flex flex-col h-[60vh] md:h-full">
        <Card className="flex-1 border-none shadow-none flex flex-col rounded-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Proximity Search
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {isSearching ? "Searching for nearby hospitals..." : `Discovered ${facilities.length} healthcare providers.`}
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {facilities.length === 0 && !isSearching && (
              <div className="text-center py-12 text-muted-foreground">
                <Hospital className="size-12 mx-auto mb-4 opacity-20" />
                <p>No hospitals found in this area.</p>
              </div>
            )}
            {facilities.map((facility) => (
              <div
                key={facility.id}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50",
                  selectedFacility?.id === facility.id ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
                )}
                onClick={() => handleFacilityClick(facility)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      facility.type === 'Hospital' ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                    )}>
                      {getIcon(facility.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{facility.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{facility.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs font-semibold" asChild>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name)}`} target="_blank" rel="noreferrer">
                      Details
                    </a>
                  </Button>
                  <Button size="sm" className="flex-1 h-8 text-xs font-semibold" asChild>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${facility.position.lat},${facility.position.lng}`} target="_blank" rel="noreferrer">
                      <Navigation className="size-3 mr-1.5" /> Go
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
