
"use client";

import { Button } from "@/components/ui/button";
import { Pill, PlusCircle, MessageSquare, Phone, MapPin, Contact, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface QuickActionsProps {
  onAddMed: () => void;
  onTakeNow: () => void;
  onCallDoctor: () => void;
  onMedicalId: () => void;
}

export function QuickActions({ onAddMed, onTakeNow, onCallDoctor, onMedicalId }: QuickActionsProps) {
  const actions = [
    { label: "Register Med", icon: PlusCircle, color: "bg-blue-500", onClick: onAddMed },
    { label: "Take Now", icon: Pill, color: "bg-emerald-500", onClick: onTakeNow },
    { label: "Care Team", icon: Phone, color: "bg-primary", onClick: onCallDoctor },
    { label: "Medical ID", icon: Contact, color: "bg-slate-900", onClick: onMedicalId },
    { label: "Care Finder", icon: MapPin, color: "bg-orange-500", href: "/dashboard/discover" },
    { label: "AI Assistant", icon: MessageSquare, color: "bg-indigo-600", href: "/dashboard/chat" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {actions.map((action, idx) => {
        const Content = (
          <Button 
            variant="outline" 
            className="h-[4.5rem] px-4 flex items-center justify-start gap-4 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md group w-full"
            onClick={action.onClick}
          >
            <div className={`p-2.5 rounded-xl ${action.color} text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform shrink-0`}>
              <action.icon className="size-5" />
            </div>
            <span className="font-black text-xs uppercase tracking-tight text-slate-700 text-left whitespace-normal leading-tight">{action.label}</span>
          </Button>
        );

        if (action.href) {
          return (
            <Link key={idx} href={action.href} className="block w-full">
              {Content}
            </Link>
          );
        }

        return <div key={idx} className="w-full">{Content}</div>;
      })}
    </div>
  );
}
