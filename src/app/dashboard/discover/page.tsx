
"use client";

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation, Loader2, Hospital, Building2, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for Metropolis (centered around a realistic set of coordinates)
const METROPOLIS_CENTER = { lat: 40.7128, lng: -74.0060 }; // NYC as a proxy for Metropolis

const facilities = [
  { 
    id: '1',
    name: "City General Hospital", 
    address: "123 Health St, Metropolis", 
    distance: "2.5 mi", 
    type: "Hospital",
    position: { lat: 40.7200, lng: -74.0100 },
    phone: "(555) 123-4567"
  },
  { 
    id: '2',
    name: "Downtown Urgent Care", 
    address: "456 Wellness Ave, Metropolis", 
    distance: "1.2 mi", 
    type: "Clinic",
    position: { lat: 40.7100, lng: -73.9900 },
    phone: "(555) 987-6543"
  },
  { 
    id: '3',
    name: "CareFirst Pharmacy", 
    address: "789 Remedy Ln, Metropolis", 
    distance: "0.8 mi", 
    type: "Pharmacy",
    position: { lat: 40.7050, lng: -74.0080 },
    phone: "(555) 444-5555"
  },
  { 
    id: '4',
    name: "Northside Medical Center", 
    address: "101 Cure Blvd, Metropolis", 
    distance: "4.1 mi", 
    type: "Hospital",
    position: { lat: 40.7350, lng: -74.0200 },
    phone: "(555) 222-3333"
  },
];

const containerStyle = {
  width: '100%',
  height: '100%'
};

export default function DiscoverPage() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [selectedFacility, setSelectedFacility] = React.useState<typeof facilities[0] | null>(null);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  const handleFacilityClick = (facility: typeof facilities[0]) => {
    setSelectedFacility(facility);
    if (map) {
      map.panTo(facility.position);
      map.setZoom(15);
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

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row">
      <div className="flex-1 relative h-[50vh] md:h-full bg-muted">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="size-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading interactive map...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={METROPOLIS_CENTER}
            zoom={13}
            onLoad={map => setMap(map)}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: false,
              styles: [
                {
                  featureType: "poi.business",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "labels.text",
                  stylers: [{ visibility: "off" }],
                },
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
                  <Button size="sm" className="w-full h-7 text-[10px]">
                    <Navigation className="size-2 mr-1" /> Get Directions
                  </Button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      <aside className="w-full md:w-80 lg:w-96 bg-background border-l flex flex-col h-[50vh] md:h-full">
        <Card className="flex-1 border-none shadow-none flex flex-col rounded-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg font-headline flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                Nearby Facilities
            </CardTitle>
            <p className="text-xs text-muted-foreground">Found {facilities.length} healthcare providers near you.</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
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
                        facility.type === 'Pharmacy' ? "bg-green-100 text-green-600" :
                        "bg-blue-100 text-blue-600"
                    )}>
                        {getIcon(facility.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{facility.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{facility.address}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded-full uppercase tracking-wider">
                    {facility.distance}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs font-semibold" asChild>
                        <a href={`tel:${facility.phone.replace(/\D/g,'')}`}>
                            <Phone className="size-3 mr-1.5" /> Call
                        </a>
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs font-semibold">
                        <Navigation className="size-3 mr-1.5" /> Directions
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
