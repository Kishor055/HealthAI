"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, MapPin, Navigation, Phone, Microscope, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils"; // Corrected cn utility import

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const HOSPITAL_ICON = L.divIcon({
  className: 'marker-hospital',
  html: `<div style="background-color: #3b82f6;" class="size-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const BLOOD_BANK_ICON = L.divIcon({
  className: 'marker-blood',
  html: `<div style="background-color: #ef4444;" class="size-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const DIAGNOSTIC_ICON = L.divIcon({
  className: 'marker-diagnostic',
  html: `<div style="background-color: #8b5cf6;" class="size-10 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const USER_ICON = L.divIcon({
  className: 'user-marker',
  html: `<div class="size-6 bg-primary rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface Facility {
  id: string;
  name: string;
  address: string;
  type: string;
  category: 'hospital' | 'blood_bank' | 'diagnostic' | 'clinic';
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

  const getIcon = (category: string) => {
    if (category === 'blood_bank') return BLOOD_BANK_ICON;
    if (category === 'diagnostic') return DIAGNOSTIC_ICON;
    return HOSPITAL_ICON;
  };

  const markers = useMemo(() => facilities.map((facility) => (
    <Marker 
      key={facility.id} 
      position={facility.position} 
      icon={getIcon(facility.category)}
      eventHandlers={{
        click: () => onFacilitySelect(facility)
      }}
    >
      <Popup className="clinical-popup">
        <div className="w-64 p-0 overflow-hidden rounded-2xl">
          <div className={cn(
            "p-4 text-white",
            facility.category === 'blood_bank' ? 'bg-red-500' : 
            facility.category === 'diagnostic' ? 'bg-purple-600' : 'bg-primary'
          )}>
            <div className="flex items-center gap-2 mb-2">
               {facility.category === 'blood_bank' ? <Droplets className="size-4" /> : 
                facility.category === 'diagnostic' ? <Microscope className="size-4" /> : <Hospital className="size-4" />}
               <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{facility.type}</span>
            </div>
            <h3 className="font-black text-sm uppercase leading-tight tracking-tighter">{facility.name}</h3>
          </div>
          <div className="p-4 space-y-4 bg-white">
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="size-3 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium leading-relaxed">{facility.address}</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="size-9 rounded-xl border-2" asChild>
                 <a href={`tel:${facility.phone}`}><Phone className="size-4" /></a>
              </Button>
              <Button size="sm" className="flex-1 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${facility.position[0]},${facility.position[1]}`)}>
                <Navigation className="size-3 mr-1.5" /> Route
              </Button>
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
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} zoomControl={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topleft" />
      <ChangeView center={center} />
      <Marker position={center} icon={USER_ICON} />
      {markers}
    </MapContainer>
  );
}
