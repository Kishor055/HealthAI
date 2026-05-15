
"use client";

import { Button } from "@/components/ui/button";
import { Pill, PlusCircle, MessageSquare, Phone, MapPin } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  onAddMed: () => void;
  onTakeNow: () => void;
  onCallDoctor: () => void;
}

export function QuickActions({ onAddMed, onTakeNow, onCallDoctor }: QuickActionsProps) {
  const actions = [
    { icon: PlusCircle, label: "Add Med", onClick: onAddMed, color: "bg-blue-500" },
    { icon: Pill, label: "Take Now", onClick: onTakeNow, color: "bg-green-500" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <Button 
          key={index} 
          variant="outline" 
          className="h-12 px-4 flex items-center gap-2 rounded-xl border-2 hover:bg-muted transition-all"
          onClick={action.onClick}
          suppressHydrationWarning
        >
          <div className={`p-1.5 rounded-lg ${action.color} text-white`}>
            <action.icon className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">{action.label}</span>
        </Button>
      ))}
      <Link href="/dashboard/chat">
        <Button variant="outline" className="h-12 px-4 flex items-center gap-2 rounded-xl border-2 hover:bg-muted transition-all" suppressHydrationWarning>
          <div className="p-1.5 rounded-lg bg-purple-500 text-white">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">AI Chat</span>
        </Button>
      </Link>
      <Link href="/dashboard/discover">
        <Button variant="outline" className="h-12 px-4 flex items-center gap-2 rounded-xl border-2 hover:bg-muted transition-all" suppressHydrationWarning>
          <div className="p-1.5 rounded-lg bg-orange-500 text-white">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">Clinic</span>
        </Button>
      </Link>
      <Button 
        variant="outline" 
        className="h-12 px-4 flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
        onClick={onCallDoctor}
        suppressHydrationWarning
      >
        <Phone className="h-4 w-4" />
        <span className="font-semibold text-sm">Call Doctor</span>
      </Button>
    </div>
  );
}
