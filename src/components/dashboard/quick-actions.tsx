"use client";

import { Button } from "@/components/ui/button";
import { Pill, PlusCircle, MessageSquare, Phone, MapPin } from "lucide-react";
import Link from "next/link";

const actions = [
  { icon: PlusCircle, label: "Add Med", href: "/dashboard/medications", color: "bg-blue-500" },
  { icon: Pill, label: "Take Now", href: "/dashboard", color: "bg-green-500" },
  { icon: MessageSquare, label: "AI Chat", href: "/dashboard/chat", color: "bg-purple-500" },
  { icon: MapPin, label: "Clinic", href: "/dashboard/discover", color: "bg-orange-500" },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <Button variant="outline" className="h-12 px-4 flex items-center gap-2 rounded-xl border-2 hover:bg-muted transition-all">
            <div className={`p-1.5 rounded-lg ${action.color} text-white`}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm">{action.label}</span>
          </Button>
        </Link>
      ))}
      <Button variant="outline" className="h-12 px-4 flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all">
        <Phone className="h-4 w-4" />
        <span className="font-semibold text-sm">Call Doctor</span>
      </Button>
    </div>
  );
}
