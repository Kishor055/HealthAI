
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
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
      {actions.map((action, idx) => {
        const Content = (
          <Button 
            variant="outline" 
            className="h-16 px-5 flex items-center justify-between gap-4 rounded-[1.25rem] border-2 border-white bg-white hover:bg-slate-50 hover:border-primary/20 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.03)] group min-w-[160px]"
            onClick={action.onClick}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${action.color} text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                <action.icon className="size-4" />
              </div>
              <span className="font-black text-xs uppercase tracking-tighter">{action.label}</span>
            </div>
            <ChevronRight className="size-3 opacity-0 group-hover:opacity-30 transition-all -translate-x-2 group-hover:translate-x-0" />
          </Button>
        );

        if (action.href) {
          return (
            <Link key={idx} href={action.href} className="block">
              {Content}
            </Link>
          );
        }

        return <div key={idx}>{Content}</div>;
      })}
    </div>
  );
}
