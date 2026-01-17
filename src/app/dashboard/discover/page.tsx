import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { placeholderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation } from "lucide-react";

const facilities = [
  { name: "City General Hospital", address: "123 Health St, Metropolis", distance: "2.5 mi", type: "Hospital" },
  { name: "Downtown Clinic", address: "456 Wellness Ave, Metropolis", distance: "1.2 mi", type: "Clinic" },
  { name: "CareFirst Pharmacy", address: "789 Remedy Ln, Metropolis", distance: "0.8 mi", type: "Pharmacy" },
  { name: "Northside Medical Center", address: "101 Cure Blvd, Metropolis", distance: "4.1 mi", type: "Hospital" },
];

export default function DiscoverPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] md:grid md:grid-cols-3">
      <div className="md:col-span-2 relative h-full">
        <Image
          src={placeholderImages.find(p => p.id === 'discover-map')?.imageUrl ?? ''}
          alt="Map of nearby healthcare facilities"
          data-ai-hint="city map"
          fill
          className="object-cover"
        />
         <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      <div className="md:col-span-1 bg-background p-4 overflow-y-auto h-full absolute bottom-0 left-0 right-0 md:static h-1/2 md:h-full rounded-t-2xl md:rounded-none">
        <Card className="h-full border-none shadow-none">
          <CardHeader>
            <CardTitle>Nearby Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {facilities.map((facility, index) => (
                <div key={index} className="p-3 rounded-lg border flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold">{facility.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="size-3"/> {facility.address}</p>
                        </div>
                        <p className="text-sm font-medium">{facility.distance}</p>
                    </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><Phone className="size-3 mr-1.5" /> Call</Button>
                    <Button size="sm"><Navigation className="size-3 mr-1.5" /> Navigate</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
