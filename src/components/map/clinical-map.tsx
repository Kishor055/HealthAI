
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, MapPin, Navigation, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Fix Leaflet Default Icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom static icons to avoid recreation during render
const HOSPITAL_ICON = L.divIcon({
  className: 'custom-clinical-marker',
  html: `<div style="background-color: #3b82f6;" class="size-8 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const USER_ICON = L.divIcon({
  className: 'user-marker',
  html: `<div class="size-6 bg-accent rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  position: [number, number];
  phone?: string;
}

interface ClinicalMapProps {
  facilities: Facility[];
  center: [number, number];
  onFacilitySelect: (facility: Facility) => void;
  selectedId?: string;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function ClinicalMap({ facilities, center, onFacilitySelect, selectedId }: ClinicalMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleNavigate = (facility: Facility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.position[0]},${facility.position[1]}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Memoize markers to prevent leaflet from re-rendering them unnecessarily
  const markers = useMemo(() => facilities.map((facility) => (
    <Marker 
      key={facility.id} 
      position={facility.position} 
      icon={HOSPITAL_ICON}
      eventHandlers={{
        click: () => onFacilitySelect(facility)
      }}
    >
      <Popup className="clinical-popup">
        <div className="w-64 p-0">
          <div className="bg-primary p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
               <Hospital className="size-4" />
               <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Clinical Facility</span>
            </div>
            <h3 className="font-black text-sm uppercase leading-tight tracking-tighter">{facility.name}</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="size-3 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-relaxed">{facility.address}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20" 
                onClick={() => handleNavigate(facility)}
              >
                <Navigation className="size-3 mr-1.5" /> Nav
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
                onClick={() => onFacilitySelect(facility)}
              >
                <Info className="size-3 mr-1.5" /> Details
              </Button>
            </div>
          </div>
          <div className="px-4 pb-4">
             <div className="p-2 bg-accent/10 rounded-xl border border-accent/20 flex items-center gap-2">
                <ShieldCheck className="size-3 text-accent" />
                <span className="text-[8px] font-black text-accent uppercase tracking-widest">Verified Healthcare Provider</span>
             </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )), [facilities, onFacilitySelect]);

  if (!isClient) return (
    <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center gap-4">
      <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Initializing Map Core...</span>
    </div>
  );

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      scrollWheelZoom={true} 
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topleft" />
      <ChangeView center={center} />
      
      <Marker position={center} icon={USER_ICON}>
        <Popup>
          <div className="p-3 text-center">
            <Badge variant="outline" className="mb-2 text-[9px] font-black uppercase tracking-widest">Your Location</Badge>
            <p className="text-xs font-bold">Scanning for nearby clinics...</p>
          </div>
        </Popup>
      </Marker>

      {markers}
    </MapContainer>
  );
}
